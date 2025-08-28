const API_BASE = "http://localhost:8080/api/books";

// ======== 상태 ========
let editingBookId = null;
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector("#cancelBtn");

// ======== 유틸 ========
function $(sel) { return document.querySelector(sel); }
function showError(msg) {
  const el = $("#formError");
  el.textContent = msg || "";
  el.style.display = msg ? "inline" : "none";
}

// ======== 검증 ========
function validateBook(book) {
  if (!book.title) return "제목은 필수입니다.";
  if (!book.author) return "저자는 필수입니다.";
  if (!book.isbn) return "ISBN은 필수입니다.";
  if (!book.price || Number(book.price) <= 0) return "가격은 0보다 커야 합니다.";
  return true;
}

// ======== CRUD ========

// 등록
async function createBook(book) {
  const resp = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(()=>({}));
    showError(err.message || "등록 실패");
    return;
  }
  resetForm();
  await loadBooks();
}

// 삭제
async function deleteBook(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  const resp = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (resp.ok) {
    await loadBooks();
  } else {
    alert("삭제 실패");
  }
}

// 수정 전 데이터 로드
async function editBook(id) {
  const resp = await fetch(`${API_BASE}/${id}`);
  if (!resp.ok) { alert("불러오기 실패"); return; }
  const book = await resp.json();

  $("#title").value = book.title;
  $("#author").value = book.author;
  $("#isbn").value = book.isbn;
  $("#price").value = book.price;
  $("#publishDate").value = book.publishDate ?? "";
  $("#publisher").value = book.detail?.publisher ?? "";
  $("#language").value = book.detail?.language ?? "";
  $("#pageCount").value = book.detail?.pageCount ?? "";
  $("#edition").value = book.detail?.edition ?? "";
  $("#coverImageUrl").value = book.detail?.coverImageUrl ?? "";
  $("#description").value = book.detail?.description ?? "";

  editingBookId = id;
  submitButton.textContent = "도서 수정";
  cancelButton.style.display = "inline-block";
}

// 수정
async function updateBook(id, book) {
  const resp = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });
  if (!resp.ok) {
    alert("수정 실패");
    return;
  }
  resetForm();
  await loadBooks();
}

// ======== 목록 ========
async function loadBooks() {
  const resp = await fetch(API_BASE);
  const books = await resp.json();
  renderBookTable(books);
}

function renderBookTable(books) {
  const tbody = $("#bookTableBody");
  tbody.innerHTML = "";
  books.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.title}</td>
      <td>${b.author}</td>
      <td>${b.isbn}</td>
      <td>${new Intl.NumberFormat("ko-KR").format(b.price)}</td>
      <td>${b.publishDate ?? ""}</td>
      <td>${b.detail?.publisher ?? ""}</td>
      <td>
        <button onclick="editBook(${b.id})">수정</button>
        <button onclick="deleteBook(${b.id})">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======== reset ========
function resetForm() {
  $("#bookForm").reset();
  editingBookId = null;
  submitButton.textContent = "도서 등록";
  cancelButton.style.display = "none";
  showError("");
}

// ======== 폼 바인딩 ========
function bindForm() {
  const form = $("#bookForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const book = {
      title: $("#title").value.trim(),
      author: $("#author").value.trim(),
      isbn: $("#isbn").value.trim(),
      price: Number($("#price").value),
      publishDate: $("#publishDate").value || null,
      detail: {
        publisher: $("#publisher").value.trim(),
        language: $("#language").value.trim(),
        pageCount: $("#pageCount").value ? Number($("#pageCount").value) : null,
        edition: $("#edition").value.trim(),
        coverImageUrl: $("#coverImageUrl").value.trim(),
        description: $("#description").value.trim(),
      }
    };
    const valid = validateBook(book);
    if (valid !== true) { showError(valid); return; }

    if (editingBookId) {
      await updateBook(editingBookId, book);
    } else {
      await createBook(book);
    }
  });

  cancelButton.addEventListener("click", resetForm);
}

// ======== 초기화 ========
window.addEventListener("DOMContentLoaded", async () => {
  bindForm();
  await loadBooks();
});