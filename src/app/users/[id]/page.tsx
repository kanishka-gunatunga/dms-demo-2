/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Heading from "@/components/common/Heading";
import DashboardLayout from "@/components/DashboardLayout";
import useAuth from "@/hooks/useAuth";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { getWithAuth, postWithAuth } from "@/utils/apiClient";
import { useRouter } from "next/navigation";
import { IoClose, IoSaveOutline } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";
import ToastMessage from "@/components/common/Toast";
import { fetchRoleData, fetchSectors, fetchSupervisors } from "@/utils/dataFetchFunctions";
import { RoleDropdownItem, SectorDropdownItem, SupervisorDropdownItem } from "@/types/types";

type Params = { id: string };

interface Props { params: Params }

interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  email?: string;
  role?: string;
  sector?: string;
  supervisors?: string;
}

export default function AllDocTable({ params }: Props) {
  const isAuthenticated = useAuth();
  const router = useRouter();
  const id = params?.id;

  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");

  // roles
  const [roleDropDownData, setRoleDropDownData] = useState<RoleDropdownItem[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRolesNeedApproval, setSelectedRolesNeedApproval] = useState(false);

  // sectors
  const [sectorDropDownData, setSectorDropDownData] = useState<SectorDropdownItem[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");

  // supervisors
  const [supervisorDropDownData, setSupervisorDropDownData] = useState<SupervisorDropdownItem[]>([]);
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<string[]>([]);
  const [supervisors, setSupervisors] = useState<string[]>([]);

  const handleSectorSelect = (sectorId: string) => setSelectedSectorId(sectorId);

  const handleRoleSelect = (roleId: string) => {
    const selectedRole = roleDropDownData.find((role) => role.id.toString() === roleId);
    if (selectedRole && !selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
      setRoles((prev) => [...prev, selectedRole.role_name]);
    }
  };

  const handleRemoveRole = (roleId: string) => {
    const roleToRemove = roleDropDownData.find((role) => role.id.toString() === roleId);
    if (roleToRemove) {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleToRemove.id.toString()));
      setRoles((prev) => prev.filter((r) => r !== roleToRemove.role_name));
    }
  };

  const handleSupervisorSelect = (supervisorId: string) => {
    const selectedSupervisor = supervisorDropDownData.find((sup) => sup.id.toString() === supervisorId);
    if (selectedSupervisor && !selectedSupervisorIds.includes(supervisorId)) {
      setSelectedSupervisorIds((prev) => [...prev, supervisorId]);
      setSupervisors((prev) => [...prev, selectedSupervisor.user_name]);
    }
  };

  const handleRemoveSupervisor = (supervisorId: string) => {
    const supervisorToRemove = supervisorDropDownData.find((sup) => sup.id.toString() === supervisorId);
    if (supervisorToRemove) {
      setSelectedSupervisorIds((prev) => prev.filter((id) => id !== supervisorId));
      setSupervisors((prev) => prev.filter((name) => name !== supervisorToRemove.user_name));
    }
  };

  useEffect(() => {
    fetchRoleData(setRoleDropDownData);
    fetchSectors(setSectorDropDownData);
    fetchSupervisors(setSupervisorDropDownData);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchUserDetails = async () => {
      try {
        const response = await getWithAuth(`user-details/${id}`);
        setFirstName(response.user_details.first_name || "");
        setLastName(response.user_details.last_name || "");
        setMobileNumber(response.user_details.mobile_no?.toString() || "");
        setEmail(response.email || "");
        setSelectedSectorId(response.user_details.sector);

        // roles
        const roleIds = parseRoles(response.role);
        setSelectedRoleIds(roleIds);

        // supervisors
        if (response.supervisors) {
          const supervisorIds = response.supervisors.map((s: any) => s.id.toString());
          const supervisorNames = response.supervisors.map((s: any) => s.user_name);
          setSelectedSupervisorIds(supervisorIds);
          setSupervisors(supervisorNames);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      }
    };

    fetchUserDetails();
  }, [id]);

  useEffect(() => {
    const initialRoles = roleDropDownData
      .filter((role) => selectedRoleIds.includes(role.id.toString()))
      .map((role) => role.role_name);

    setRoles(initialRoles);

    // check if any role needs approval
    const needsApproval = roleDropDownData.some(
      (role) => selectedRoleIds.includes(role.id.toString()) && role.needs_approval === 1
    );
    setSelectedRolesNeedApproval(needsApproval);

    // clear supervisors if no roles need approval
    if (!needsApproval) {
      setSelectedSupervisorIds([]);
      setSupervisors([]);
    }
  }, [selectedRoleIds, roleDropDownData]);

  const parseRoles = (roleData: any): string[] => {
    if (typeof roleData === "string") {
      const cleanedData = roleData.replace(/[^0-9,]/g, '');
      return cleanedData.split(',').filter((roleId) => roleId.trim() !== "");
    }
    return [];
  };

  const validateFields = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!firstName.trim()) newErrors.first_name = "First name is required.";
    if (!lastName.trim()) newErrors.last_name = "Last name is required.";
    if (!mobileNumber.trim()) newErrors.mobile_no = "Mobile number is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!selectedRoleIds.length) newErrors.role = "At least select one role.";
    if (!selectedSectorId) newErrors.sector = "Sector is required.";
    if (selectedRolesNeedApproval && !selectedSupervisorIds.length) newErrors.supervisors = "At least select one supervisor.";
    return newErrors;
  };

  const handleSubmit = async () => {
    const fieldErrors = validateFields();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("mobile_no", mobileNumber);
    formData.append("email", email);
    formData.append("role", JSON.stringify(selectedRoleIds));
    formData.append("sector", selectedSectorId);
    formData.append("supervisors", JSON.stringify(selectedSupervisorIds));

    try {
      const response = await postWithAuth(`user-details/${id}`, formData);

      if (response.status === "fail") {
        setToastType("error");
        setToastMessage("Failed to update user!");
      } else {
        setToastType("success");
        setToastMessage("User updated successfully!");
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  if (!isAuthenticated) return <LoadingSpinner />;

  return (
    <>
      <DashboardLayout>
        <div className="d-flex justify-content-between align-items-center pt-2">
          <Heading text="Manage Users" color="#444" />
        </div>

        <div className="d-flex flex-column bg-white p-2 p-lg-3 rounded mt-3">
          <div style={{ maxHeight: "380px", overflowY: "auto" }} className="custom-scroll">
            <div className="p-0 row row-cols-1 row-cols-md-2 overflow-hidden w-100">
              {/* First Name */}
              <div className="d-flex flex-column">
                <p className="mb-1" style={{ fontSize: "14px" }}>First Name</p>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`${errors.first_name ? "is-invalid" : ""} form-control mb-3`}
                />
                {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
              </div>

              {/* Last Name */}
              <div className="d-flex flex-column">
                <p className="mb-1" style={{ fontSize: "14px" }}>Last Name</p>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`${errors.last_name ? "is-invalid" : ""} form-control mb-3`}
                />
                {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
              </div>

              {/* Mobile */}
              <div className="d-flex flex-column">
                <p className="mb-1" style={{ fontSize: "14px" }}>Mobile Number</p>
                <input
                  type="number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className={`${errors.mobile_no ? "is-invalid" : ""} form-control mb-3`}
                />
                {errors.mobile_no && <div className="invalid-feedback">{errors.mobile_no}</div>}
              </div>

              {/* Email */}
              <div className="d-flex flex-column">
                <p className="mb-1" style={{ fontSize: "14px" }}>Email</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${errors.email ? "is-invalid" : ""} form-control mb-3`}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Roles */}
              <div className="col-12 col-lg-6 d-flex flex-column">
                <p className="mb-1">Roles</p>
                <DropdownButton
                  id="dropdown-role-button"
                  title={roles.length ? roles.join(", ") : "Select Roles"}
                  className="mb-3"
                  onSelect={(value) => value && handleRoleSelect(value)}
                >
                  {roleDropDownData.map((role) => (
                    <Dropdown.Item key={role.id} eventKey={role.id}>
                      {role.role_name}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
                {errors.role && <div style={{ color: "red", fontSize: "12px" }}>{errors.role}</div>}
                <div>
                  {roles.map((roleName) => {
                    const role = roleDropDownData.find((r) => r.role_name === roleName);
                    if (!role) return null;
                    return (
                      <span key={role.id} className="badge bg-primary text-light me-2 p-2 d-inline-flex align-items-center">
                        {roleName}
                        <IoClose style={{ cursor: "pointer" }} onClick={() => handleRemoveRole(role.id.toString())} />
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Sector */}
              <div className="col-12 col-lg-6 d-flex flex-column">
                <p className="mb-1">Sector</p>
                <DropdownButton
                  id="dropdown-sector-button"
                  title={selectedSectorId ? sectorDropDownData.find(s => s.id.toString() === selectedSectorId)?.sector_name : "Select Sector"}
                  onSelect={(value) => handleSectorSelect(value || "")}
                  className="mb-3"
                >
                  {sectorDropDownData.map((sector) => (
                    <Dropdown.Item key={sector.id} eventKey={sector.id.toString()} style={{ fontWeight: sector.parent_sector === "none" ? "bold" : "normal", paddingLeft: sector.parent_sector === "none" ? "10px" : "20px" }}>
                      {sector.sector_name}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
                {errors.sector && <div style={{ color: "red", fontSize: "12px" }}>{errors.sector}</div>}
              </div>

              {/* Supervisors */}
              {selectedRolesNeedApproval && (
                <div className="col-12 col-lg-6 d-flex flex-column">
                  <p className="mb-1">Supervisors</p>
                  <DropdownButton
                    id="dropdown-supervisor-button"
                    title={supervisors.length ? supervisors.join(", ") : "Select Supervisors"}
                    onSelect={(value) => value && handleSupervisorSelect(value)}
                    className="mb-3"
                  >
                    {supervisorDropDownData.map((sup) => (
                      <Dropdown.Item key={sup.id} eventKey={sup.id}>{sup.user_name}</Dropdown.Item>
                    ))}
                  </DropdownButton>
                  {errors.supervisors && <div style={{ color: "red", fontSize: "12px" }}>{errors.supervisors}</div>}
                  <div>
                    {supervisors.map((name) => {
                      const sup = supervisorDropDownData.find((s) => s.user_name === name);
                      return sup ? (
                        <span key={sup.id} className="badge bg-info text-dark me-2 p-2 d-inline-flex align-items-center">
                          {name}
                          <IoClose style={{ cursor: "pointer" }} onClick={() => handleRemoveSupervisor(sup.id.toString())} />
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Submit Buttons */}
          <div className="d-flex flex-row mt-5">
            <button className="btn btn-success me-2" onClick={handleSubmit}><IoSaveOutline /> Save</button>
            <button className="btn btn-danger" onClick={() => router.push("/users")}><MdOutlineCancel /> Cancel</button>
          </div>
        </div>
      </DashboardLayout>

      {/* Toast */}
      <ToastMessage message={toastMessage} show={showToast} onClose={() => setShowToast(false)} type={toastType} />
    </>
  );
}
