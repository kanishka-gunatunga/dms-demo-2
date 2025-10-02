/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Heading from "@/components/common/Heading";
import Paragraph from "@/components/common/Paragraph";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownButton,
  Form,
  Modal,
  Pagination,
  Table,
} from "react-bootstrap";
import { AiOutlineZoomOut, AiFillDelete } from "react-icons/ai";
import { BiSolidCommentDetail } from "react-icons/bi";
import { BsBellFill } from "react-icons/bs";
import { FaArchive, FaEllipsisV, FaShareAlt } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { GoHistory } from "react-icons/go";
import {
  IoAdd,
  IoCheckmark,
  IoClose,
  IoEye,
  IoFolder,
  IoSaveOutline,
  IoSettings,
  IoShareSocial,
  IoTrash,
  IoTrashOutline,
} from "react-icons/io5";
import { Button, Checkbox, DatePicker, Input, Menu, Radio } from "antd";
import type { DatePickerProps } from "antd";
import type { RadioChangeEvent } from "antd";
import {
  MdArrowDropDown,
  MdArrowDropUp,
  MdEmail,
  MdFileDownload,
  MdCheck,
  MdModeEditOutline,
  MdOutlineCancel,
  MdOutlineInsertLink,
  MdUpload,
} from "react-icons/md";

import useAuth from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  deleteAllWithAuth,
  deleteWithAuth,
  getWithAuth,
  postWithAuth,
} from "@/utils/apiClient";
import { handleDownload, handleView } from "@/utils/documentFunctions";
import {
  fetchUnapprovedDocumentsData,
} from "@/utils/dataFetchFunctions";
import { useUserContext } from "@/context/userContext";
import ToastMessage from "@/components/common/Toast";
import { IoMdSend, IoMdTrash } from "react-icons/io";
import {
  CommentItem,
  RoleDropdownItem,
  UserDropdownItem,
  VersionHistoryItem,
} from "@/types/types";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

import "react-quill/dist/quill.snow.css";
import LoadingBar from "@/components/common/LoadingBar";
import { hasPermission } from "@/utils/permission";
import { usePermissions } from "@/context/userPermissions";
import Image from "next/image";
import { LuText } from "react-icons/lu";
import { useChat } from "@/context/ChatContext";
import { PiStarFourThin } from "react-icons/pi";

interface Category {
  category_name: string;
}

interface TableItem {
  id: number;
  name: string;
  category: Category;
  storage: string;
  created_date: string;
  type: string;
  created_by: string;
  document_preview: string;
}

interface ShareItem {
  id: number;
  allow_download: number;
  name: string;
  type: string;
  email: string;
  start_date_time: string;
  end_date_time: string;
}

interface EditDocumentItem {
  id: number;
  name: string;
  category: Category;
  description: string;
  meta_tags: string;
}

interface Attribute {
  value: string;
  attribute: string;
}

interface ViewDocumentItem {
  id: number;
  name: string;
  category: { id: number; category_name: string };
  description: string;
  meta_tags: string;
  attributes: string;
  type: string;
  url: string;
  enable_external_file_view: number;
}

interface CategoryDropdownItem {
  id: number;
  parent_category: string;
  category_name: string;
}

interface HalfMonth {
  period: string;
  month: string;
  date: string | number;
}

export default function AllDocTable() {
  const { userId, userName } = useUserContext();
  const isAuthenticated = useAuth();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedItemsNames, setSelectedItemsNames] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [dummyData, setDummyData] = useState<TableItem[]>([]);
  const [showModal, setShowModal] = useState(false);
    const [selectedDocumentName, setSelectedDocumentName] = useState<
      string | null
    >(null);
const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const currentDateTime = new Date().toLocaleString();
  const [metaTags, setMetaTags] = useState<string[]>([]);
  const [viewMetaTags, setViewMetaTags] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [currentMeta, setCurrentMeta] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [content, setContent] = useState<string>("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(1);

  const [roleDropDownData, setRoleDropDownData] = useState<RoleDropdownItem[]>(
    []
  );
  const [modalStates, setModalStates] = useState({
    viewModel: false,
    deleteFileModel: false,
    docApproveModel: false,
  });


  const [viewDocument, setViewDocument] = useState<ViewDocumentItem | null>(
    null
  );
  
  const [editErrors, seteditErrors] = useState<any>({});
  
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);


  useEffect(() => {

    fetchUnapprovedDocumentsData(setDummyData);
  }, []);

 

  const handleSort = () => {
    setSortAsc(!sortAsc);
    const sortedData = [...dummyData].sort((a, b) =>
      sortAsc
        ? new Date(a.created_date).getTime() -
          new Date(b.created_date).getTime()
        : new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime()
    );
    setDummyData(sortedData);
  };

  const handleOpenModal = (
  modalName: keyof typeof modalStates,
  documentId?: number,
  documentName?: string
) => {
  if (documentId) setSelectedDocumentId(documentId);
  if (documentName) setSelectedDocumentName(documentName);

  setModalStates((prev) => ({ ...prev, [modalName]: true }));
};

  const handleCloseModal = (modalName: keyof typeof modalStates) => {
    setModalStates((prev) => ({ ...prev, [modalName]: false }));
  };

  // pagination
  const totalItems = Array.isArray(dummyData) ? dummyData.length : 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const paginatedData = Array.isArray(dummyData)
    ? dummyData.slice(startIndex, endIndex)
    : [];



  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  )  => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  useEffect(() => {
      if (modalStates.viewModel && selectedDocumentId !== null) {
        handleGetViewData(selectedDocumentId);
        console.log("View Document : ", viewDocument);
      }
    }, [modalStates.viewModel, selectedDocumentId]);
  
    const handleDeleteDocument = async (id: number) => {
      if (!id) {
        console.error("Invalid document ID");
        return;
      }
  
      try {
        const response = await  getWithAuth(`delete-document/${id}/${userId}`);
  
        if (response.status === "success") {
          handleCloseModal("deleteFileModel");
          setToastType("success");
          setToastMessage("Document deleted successfully!");
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
          }, 5000);
          fetchUnapprovedDocumentsData(setDummyData);
        } else {
          setToastType("error");
          setToastMessage("An error occurred while deleting the document!");
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
          }, 5000);
        }
      } catch (error) {
        // console.error("Error deleting document:", error);
        setToastType("error");
        setToastMessage("An error occurred while deleting the document!");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    };
    const handleDocumentApprove = async (id: number, userId: string) => {
        try {
          const formData = new FormData();
          formData.append("user", userId);
          const response = await postWithAuth(`document-approve/${id}`, formData);
          if (response.status === "success") {
            handleCloseModal("docApproveModel");
            setToastType("success");
            setToastMessage("Document approved successfully!");
            setShowToast(true);
            setTimeout(() => {
              setShowToast(false);
            }, 5000);
          } else {
            setToastType("error");
            setToastMessage("An error occurred while approving the document!");
            setShowToast(true);
            setTimeout(() => {
              setShowToast(false);
            }, 5000);
          }
          fetchUnapprovedDocumentsData(setDummyData);
        } catch (error) {
          setToastType("error");
          setToastMessage("An error occurred while approving the document!");
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
          }, 5000);
          // console.error("Error archiving document:", error);
        }
      };
  const handleMouseMove = (e: React.MouseEvent<HTMLTableRowElement>) => {
    setCursorPosition({ x: e.clientX, y: e.clientY });
  };

  const handleGetViewData = async (id: number) => {
    try {
      const response = await getWithAuth(`view-document/${id}/${userId}`);
      // console.log("preview data : ", response)
      const data = response.data;

      const parsedMetaTags = JSON.parse(data.meta_tags || "[]");
      const parsedAttributes = JSON.parse(data.attributes || "[]");

      setViewDocument(data);
      setMetaTags(parsedMetaTags);
      setAttributes(parsedAttributes);
    } catch (error) {
      console.error("Error :", error);
    }
  };

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  console.log("paginatedData : -- ", paginatedData);
  return (
    <>
      <DashboardLayout>
        <div className="d-flex justify-content-between align-items-center pt-2">
          <div className="d-flex flex-row align-items-center">
            <Heading text="Approve Documents" color="#444" />
 
          </div>
         
        </div>
        <div className="d-flex flex-column bg-white p-2 p-lg-3 rounded mt-3 position-relative">
          
          <div>{isLoadingTable && <LoadingBar />}</div>
          <div>
            <div
              style={{ maxHeight: "350px", overflowY: "auto" }}
              className="custom-scroll "
            >
              <Table hover responsive>
                <thead className="sticky-header">
                  <tr>
                    
                    <th>Action</th>
                    <th className="text-start">Name</th>
                    <th className="text-start">Document Category</th>
                    <th className="text-start">Storage</th>
                    <th
                      className="text-start"
                      onClick={handleSort}
                      style={{ cursor: "pointer" }}
                    >
                      Created Date{" "}
                      {sortAsc ? (
                        <MdArrowDropUp fontSize={20} />
                      ) : (
                        <MdArrowDropDown fontSize={20} />
                      )}
                    </th>
                    <th className="text-start">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <tr
                        key={item.id}
                        onMouseEnter={() => setHoveredRow(item.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onMouseMove={handleMouseMove}
                      >
                        
                        <td>
                          <DropdownButton
                            id="dropdown-basic-button" 
                            drop="end"
                            title={<FaEllipsisV />}
                            className="no-caret position-static"
                            style={{ zIndex: "99999" }}
                          >
                            {/* {hasPermission(permissions, "All Documents", "View Documents") && (
                              <Dropdown.Item
                                href="#"
                                className="py-2"
                                onClick={() => handleView(item.id, userId)}
                              >
                                <IoEye className="me-2" />
                                View
                              </Dropdown.Item>
                            )} */}
              
                              <Dropdown.Item
                                className="py-2"
                                onClick={() =>
                                  handleOpenModal(
                                    "viewModel",
                                    item.id,
                                    item.name
                                  )
                                }
                              >
                                <IoEye className="me-2" />
                                View
                              </Dropdown.Item>
   
                    
                            <Dropdown.Item className="py-2">
                                <Link
                                  href={"#"}
                                  style={{ color: "#212529" }}
                                  onClick={() =>
                                    handleOpenModal(
                                    "docApproveModel",
                                    item.id,
                                    item.name
                                  )
                                  }
                                >
                                  <MdCheck className="me-2" />
                                  Approve
                                </Link>
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() =>
                                  handleOpenModal(
                                    "deleteFileModel",
                                    item.id,
                                    item.name
                                  )
                                }
                                className="py-2"
                              >
                                <AiFillDelete className="me-2" />
                                Delete
                              </Dropdown.Item>
                     
                          </DropdownButton>
                        </td>
                        {/* <td>
                          {item.name}
                          {hoveredRow === item.id && item.document_preview && (
                            <div
                              className="preview-image"
                              style={{
                                position: "fixed",
                                top: cursorPosition.y + 10,
                                left: cursorPosition.x + 10,
                                width: "200px",
                                maxHeight: "200px",
                                maxWidth: "200px",
                                zIndex: 1000,
                              }}
                            >
                              <Image
                                src={item.document_preview}
                                alt="Preview"
                                width={200}
                                height={200}
                              />
                            </div>
                          )}
                        </td> */}
                        <td
                          onMouseEnter={() => setHoveredRow(item.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {item.name}
                          {hoveredRow === item.id && item.document_preview && (
                            <div
                              className="preview-image p-0"
                              style={{
                                position: "fixed",
                                top: cursorPosition.y + 10,
                                left: cursorPosition.x + 10,
                                width: "200px",
                                maxHeight: "200px",
                                maxWidth: "200px",
                                zIndex: 1000,
                                overflow: "hidden",
                              }}
                            >
                              <Image
                                src={item.document_preview}
                                alt="Preview"
                                width={200}
                                height={200}
                                style={{
                                  width: "200px",
                                  height: "200px",
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td>{item.category?.category_name || ""}</td>
                        <td>{item.storage}</td>
                        <td>
                          {new Date(item.created_date).toLocaleDateString(
                            "en-GB"
                          )}
                        </td>
                        <td>{item.created_by}</td>
                      </tr>
                    ))
                  ) : (
                    <div className="text-start w-100 py-3">
                      <Paragraph text="No data available" color="#333" />
                    </div>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="d-flex flex-column flex-lg-row paginationFooter">
              <div className="d-flex justify-content-between align-items-center">
                <p className="pagintionText mb-0 me-2">Items per page:</p>
                <Form.Select
                  onChange={handleItemsPerPageChange}
                  value={itemsPerPage}
                  style={{
                    width: "100px",
                    padding: "5px 10px !important",
                    fontSize: "12px",
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </Form.Select>
              </div>
              <div className="d-flex flex-row align-items-center px-lg-5">
                <div className="pagination-info" style={{ fontSize: "14px" }}>
                  {startIndex} – {endIndex} of {totalItems}
                </div>

                <Pagination className="ms-3">
                  <Pagination.Prev
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Next
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </div>
          </div>
        </div>
       
        {/* delete document model */}
        <Modal
          centered
          show={modalStates.deleteFileModel}
          onHide={() => handleCloseModal("deleteFileModel")}
        >
          <Modal.Header>
            <div className="d-flex w-100 justify-content-end">
              <div className="col-11 d-flex flex-row">
                <p
                  className="mb-0 text-danger"
                  style={{ fontSize: "18px", color: "#333" }}
                >
                  Are you sure you want to delete?{" "}
                  {selectedDocumentName || "No document selected"}
                </p>
              </div>
              <div className="col-1 d-flex justify-content-end">
                <IoClose
                  fontSize={20}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCloseModal("deleteFileModel")}
                />
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="p-2 p-lg-4">
            <div className="mt-1">
              <p
                className="mb-1 text-start w-100 text-danger"
                style={{ fontSize: "14px" }}
              >
                By deleting the document, it will no longer be accessible in the
                future, and the following data will be deleted from the system:
              </p>
              <ul>
                <li>Version History</li>
                <li>Meta Tags</li>
                <li>Comment</li>
                <li>Notifications</li>
                <li>Reminders</li>
                <li>Permissions</li>
              </ul>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex flex-row">
              <button
                onClick={() => handleDeleteDocument(selectedDocumentId!)}
                className="custom-icon-button button-success px-3 py-1 rounded me-2"
              >
                <IoSaveOutline fontSize={16} className="me-1" /> Yes
              </button>
              <button
                onClick={() => {
                  handleCloseModal("deleteFileModel");
                  setSelectedDocumentId(null);
                }}
                className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
              >
                <MdOutlineCancel fontSize={16} className="me-1" /> No
              </button>
            </div>
          </Modal.Footer>
        </Modal>
     
        {/* view Modal */}
        <Modal
          centered
          show={modalStates.viewModel}
          // className="large-model"
          fullscreen
          onHide={() => {
            handleCloseModal("viewModel");
            setSelectedDocumentId(null);
          }}
        >
          <Modal.Header>
            <div className="d-flex w-100 justify-content-end">
              <div className="col-11 d-flex flex-row">
                <p className="mb-0" style={{ fontSize: "16px", color: "#333" }}>
                  View Document : {viewDocument?.name || ""}
                </p>
              </div>
              <div className="col-1 d-flex  justify-content-end">
                <IoClose
                  fontSize={20}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    handleCloseModal("viewModel");
                    setMetaTags([]);
                  }}
                />
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="p-2 p-lg-4">
             <div className="d-flex preview-container">
                          {viewDocument && (
                            <>
                              {/* Image Preview */}
                              {["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "tiff", "ico", "avif"].includes(viewDocument.type) ? (
                                <Image
                                  src={viewDocument.url}
                                  alt={viewDocument.name}
                                  width={600}
                                  height={600}
                                />
                              ) : 
                              /* TXT / CSV / LOG Preview */
                              ["txt", "csv", "log"].includes(viewDocument.type) ? (
                                <div className="text-preview" style={{ width: "100%" }}>
                                  <iframe
                                    src={viewDocument.url}
                                    title="Text Preview"
                                    style={{ width: "100%", height: "500px", border: "1px solid #ccc", background: "#fff" }}
                                  ></iframe>
                                </div>
                              ) : 
                              /* PDF or Office Docs */
                              (viewDocument.type === "pdf" || viewDocument.enable_external_file_view === 1) ? (
                                <div
                                  className="iframe-container"
                                  data-watermark={`Confidential\nDo Not Copy\n${userName}\n${currentDateTime}`}
                                >
                                  <iframe
                                    src={
                                      viewDocument.type === "pdf"
                                        ? viewDocument.url
                                        : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewDocument.url)}`
                                    }
                                    title="Document Preview"
                                    style={{ width: "100%", height: "500px", border: "none" }}
                                  ></iframe>
                                </div>
                              ) : (
                                <p>No preview available for this document type.</p>
                              )}
                            </>
                          )}
                        </div>

            <p className="mb-1" style={{ fontSize: "14px" }}>
              Document Name :{" "}
              <span style={{ fontWeight: 600 }}>
                {viewDocument?.name || ""}
              </span>
            </p>
            <p className="mb-1" style={{ fontSize: "14px" }}>
              Category :{" "}
              <span style={{ fontWeight: 600 }}>
                {viewDocument?.category.category_name}
              </span>
            </p>
            <p className="mb-1 " style={{ fontSize: "14px" }}>
              Description :{" "}
              <span style={{ fontWeight: 600 }}>
                {viewDocument?.description || ""}
              </span>
            </p>
            <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
              Meta tags:{" "}
              {metaTags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    fontWeight: 600,
                    backgroundColor: "#683ab7",
                    color: "white",
                  }}
                  className="me-2 px-3 rounded py-1 mb-2"
                >
                  {tag}
                </span>
              ))}
            </p>
            <div className="d-flex flex-column">
              <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                Attributes:
                {attributes.map((attr, index) => (
                  <div
                    key={index}
                    style={{
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                    className="me-2 px-3 rounded py-1"
                  >
                    <span style={{ fontWeight: 600 }}>{attr.attribute}:</span>{" "}
                    {attr.value}
                  </div>
                ))}
              </p>
            </div>

           
          </Modal.Body>

          <Modal.Footer>
            <div className="d-flex flex-row justify-content-start">
              {/* <button
                onClick={() => handleSaveEditData(selectedDocumentId!)}
                className="custom-icon-button button-success px-3 py-1 rounded me-2"
              >
                <IoSaveOutline fontSize={16} className="me-1" /> Yes
              </button> */}
              <button
                onClick={() => {
                  handleCloseModal("viewModel");
                  setSelectedDocumentId(null);
                  setMetaTags([]);
                }}
                className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
              >
                <MdOutlineCancel fontSize={16} className="me-1" /> Cancel
              </button>
            </div>
          </Modal.Footer>
        </Modal>

        {/* approve document model */}
                <Modal
                  centered
                  show={modalStates.docApproveModel}
                  onHide={() => {
                    handleCloseModal("docApproveModel");
                    setSelectedDocumentId(null);
                    setSelectedDocumentName(null);
                  }}
                >
                  <Modal.Header>
                    <div className="d-flex w-100 justify-content-end">
                      <div className="col-11">
                        <p className="mb-1" style={{ fontSize: "16px", color: "#333" }}>
                          Are you sure you want to approve?
                        </p>
                      </div>
                      <div className="col-1 d-flex justify-content-end">
                        <IoClose
                          fontSize={20}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleCloseModal("docApproveModel")}
                        />
                      </div>
                    </div>
                  </Modal.Header>
                  <Modal.Body className="py-3">
                    <p className="mb-1 text-start w-100" style={{ fontSize: "14px" }}>
                      {selectedDocumentName || "No document selected"}
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <div className="d-flex flex-row">
                      <button
                        onClick={() =>
                          handleDocumentApprove(selectedDocumentId!, userId!)
                        }
                        className="custom-icon-button button-success px-3 py-1 rounded me-2"
                      >
                        <IoSaveOutline fontSize={16} className="me-1" /> Yes
                      </button>
                      <button
                        onClick={() => {
                          handleCloseModal("docApproveModel");
                          setSelectedDocumentId(null);
                          setSelectedDocumentName(null);
                        }}
                        className="custom-icon-button button-danger text-white bg-danger px-3 py-1 rounded"
                      >
                        <MdOutlineCancel fontSize={16} className="me-1" /> Cancel
                      </button>
                    </div>
                  </Modal.Footer>
                </Modal>
        {/* toast message */}
        <ToastMessage
          message={toastMessage}
          show={showToast}
          onClose={() => setShowToast(false)}
          type={toastType}
        />
      </DashboardLayout>
    </>
  );
}
