async function test() {
  try {
    console.log("Starting backend API validation test...");
    
    // 1. Register a test doctor
    const docName = "Test Doctor";
    const docPass = "testpassword123";
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: docName, password: docPass })
    });
    
    const regData = await regRes.json();
    console.log("Register response:", regData);
    if (!regRes.ok) throw new Error("Registration failed: " + JSON.stringify(regData));
    
    const doctorId = regData.doctor.doctorId;
    
    // 2. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, password: docPass })
    });
    
    const loginData = await loginRes.json();
    console.log("Login response:", loginData);
    if (!loginRes.ok) throw new Error("Login failed: " + JSON.stringify(loginData));
    
    const token = loginData.token;
    
    // 3. Fetch default appointments
    const appRes = await fetch('http://localhost:5000/api/appointments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const appointments = await appRes.json();
    console.log("Appointments count:", appointments.length);

    // 4. Create an appointment
    const newAppRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patient: "Verify Patient",
        type: "In-Clinic",
        time: "10:30 AM",
        notes: "Verification test notes"
      })
    });
    const newApp = await newAppRes.json();
    console.log("Created appointment:", newApp);
    
    // 5. Delete appointment
    const delRes = await fetch(`http://localhost:5000/api/appointments/${newApp.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delData = await delRes.json();
    console.log("Delete response:", delData);

    console.log("API validation test completed successfully! 🌟");
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
