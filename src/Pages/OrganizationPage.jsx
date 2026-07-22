import { useState } from "react";
import axios from "axios";
import "./OrganizationPage.css";

function OrganizationPage({ onOrganizationCreated }) {
  const [companyName, setCompanyName] = useState("");
  const [host, setHost] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(
      "http://localhost:8000/companies",
      {
        companyName,
        host,
      }
    );

    onOrganizationCreated();
    
    console.log(response.data);

    localStorage.setItem("companyName", companyName);

    alert("Organization created successfully!");
  } catch (error) {
    console.error(error);
    alert("Failed to create organization");
  }
};

  return (
    <div className="org-container">
      <div className="org-card">
        <h1 className="org-title">Create Organization</h1>

        <p className="org-subtitle">
          Set up your organization to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization Name</label>
            <input
              type="text"
              placeholder="Enter organization name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Company Domain</label>
            <input
              type="text"
              placeholder="example.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="org-button">
            Create Organization
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrganizationPage;