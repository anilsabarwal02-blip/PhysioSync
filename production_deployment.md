# PhysioSync Production Deployment Guide 🚀

This runbook describes the step-by-step instructions for deploying the PhysioSync WebApp in a production environment ("real market"). 

---

## 📦 Architecture Overview
PhysioSync uses a **unified monolith build**:
1. **Frontend**: Vite + React client app (builds to `/dist` directory).
2. **Backend**: Express API server running on Node.js.
3. **Database**: MongoDB (local MongoDB community edition or hosted MongoDB Atlas).

In production, the backend Express server serves the compiled static files from `/dist` on the *same port*. This eliminates CORS issues and allows single-port deployments on platforms like Heroku, Render, AWS Elastic Beanstalk, and Docker.

---

## 🗄️ Step 1: Set up MongoDB Atlas (Cloud Database)
In production, do not run a local database. Use **MongoDB Atlas** for managed, high-availability storage:

1. Sign up/log in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Deployment** and select the free/shared M0 tier.
3. Choose your cloud provider (e.g. AWS) and region, then click **Create**.
4. In the Security Quickstart:
   - Create a **Database User** (e.g., username `physiouser` and a secure password). Keep these credentials safe!
   - Under **IP Access List**, add IP `0.0.0.0/0` (allows connections from any cloud provider/server). Click **Add Entry**.
5. Once your cluster is ready, click **Connect** -> **Drivers**.
6. Copy your connection string. It will look like this:
   `mongodb+srv://physiouser:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
7. Replace `<password>` in the connection string with your database user password.

---

## 🏃 Step 2: Local Production Run (Unified Build)
To test the production build on your local machine:

1. **Build the Client Frontend**:
   Navigate to the root directory and build the static assets:
   ```bash
   npm run build
   ```
   This generates the `/dist` directory.

2. **Configure Environment Variables**:
   In your hosting platform or your local server environment, configure the following variables:
   - `NODE_ENV=production`
   - `PORT=5000` (or any port of your choice)
   - `JWT_SECRET=your_production_jwt_secret_key_phrase`
   - `MONGODB_URI=your_mongodb_atlas_connection_string`

3. **Start the Production Server**:
   Navigate to the `server/` directory and run:
   ```bash
   cd server
   npm install --omit=dev
   node server.js
   ```
4. Open your browser to `http://localhost:5000` (or your configured port). The application is now fully running under a single unified Express server!

---

## 🐳 Step 3: Deploying with Docker
The repository includes a multi-stage `Dockerfile` that packages both the frontend compiler and the production Express server in a single secure container.

1. **Build the Docker Image**:
   In the root directory, run:
   ```bash
   docker build -t physiosync-app .
   ```

2. **Run the Container Locally**:
   Run the container and inject your environment variables:
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e NODE_ENV=production \
     -e JWT_SECRET="your_production_secret_key" \
     -e MONGODB_URI="your_mongodb_atlas_connection_string" \
     physiosync-app
   ```
   Access the app at `http://localhost:5000`.

---

## ☁️ Step 4: Deploying to Cloud Platforms

### Option A: Render (Easiest)
1. Log in to [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service:
   - **Runtime**: `Docker` (or Node if deploying manually).
   - If using Docker: Render will automatically detect the root `Dockerfile` and build it.
   - If using Node:
     - **Build Command**: `npm install && npm run build && cd server && npm install --omit=dev`
     - **Start Command**: `cd server && node server.js`
5. Click **Advanced** and add the environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_atlas_connection_string`
   - `JWT_SECRET=your_production_secret_key`
6. Click **Deploy Web Service**.

### Option B: Heroku
1. Install the Heroku CLI and login: `heroku login`.
2. Create a Heroku app: `heroku create physiosync-app`.
3. Set your environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
   heroku config:set JWT_SECRET="your_production_secret"
   ```
4. Push to deploy: `git push heroku main` (Heroku will run the `build` script automatically if configured, or use the Docker build pack).

### Option C: VPS (DigitalOcean / AWS EC2)
1. SSH into your server.
2. Install Node.js (v20+), Git, and MongoDB (or connect to Atlas).
3. Clone the repo and navigate to it.
4. Run:
   ```bash
   npm install
   npm run build
   cd server
   npm install --omit=dev
   ```
5. Setup a process manager like **PM2** to run the app in the background:
   ```bash
   npm install -g pm2
   PORT=80 NODE_ENV=production MONGODB_URI="your_mongodb_uri" JWT_SECRET="your_secret" pm2 start server.js --name "physiosync"
   ```
6. (Optional) Configure Nginx as a reverse proxy to manage SSL/HTTPS on port 443.
