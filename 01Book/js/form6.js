// ======== 설정 ========
const API_BASE = "http://localhost:8080/api/books"; 
let editingBookId = null; // 현재 수정 중인 도서 ID

// ======== 유틸 ========
function $(sel) { return document.querySelector(sel); }
function showError(msg) {
  const el = $("#formError");
  el.textContent = msg || "";
  el.style.display = msg ? "inline" : "none";
}

// ======== 입력값 검증 ========
function validateBook(book) {
  if (!book.title) return "제목은 필수입니다.";
  if (!book.author) return "저자는 필수입니다.";
  if (!book.isbn) return "ISBN은 필수입니다.";
  if (!book.price || Number(book.price) <= 0) return "가격은 0보다 큰 숫자여야 합니다.";
  return true;
}

// ======== 목록 불러오기 ========
async function loadBooks() {
  try {
    const resp = await fetch(API_BASE);
    if (!resp.ok) throw new Error(`조회 실패: ${resp.status}`);
    const books = await resp.json();
    renderBookTable(books);
  } catch (err) {
    console.error(err);
    alert("도서 목록 불러오기 실패");
  }
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
      <td>${b.detail ? b.detail.publisher ?? "" : ""}</td>
      <td>
        <button class="edit-btn" onclick="editBook(${b.id})">수정</button>
        <button class="delete-btn" onclick="deleteBook(${b.id})">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======== 등록(POST) ========
async function createBook(book) {
  try {
    const resp = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      showError(err.message || "등록 실패");
      return;
    }
    $("#bookForm").reset();
    showError("");
    await loadBooks();
  } catch (err) {
    console.error(err);
    showError("서버 통신 오류: " + err.message);
  }
}

// ======== 수정(PUT) ========
async function updateBook(id, book) {
  try {
    const resp = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      showError(err.message || "수정 실패");
      return;
    }

    $("#bookForm").reset();
    editingBookId = null;
    $("#submitBtn").textContent = "도서 등록";
    $("#cancelBtn").style.display = "none";
    showError("");

    await loadBooks();

  } catch (err) {
    console.error(err);
    showError("서버 통신 오류: " + err.message);
  }
}

// ======== 삭제 ========
async function deleteBook(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  try {
    const resp = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      alert(err.message || "삭제 실패");
      return;
    }
    await loadBooks();
  } catch (err) {
    console.error(err);
    alert("삭제 중 오류: " + err.message);
  }
}

// ======== 수정 모드 ========
async function editBook(id) {
  try {
    const resp = await fetch(`${API_BASE}/${id}`);
    if (!resp.ok) throw new Error("도서 조회 실패");
    const book = await resp.json();

    editingBookId = id;

    $("#title").value = book.title;
    $("#author").value = book.author;
    $("#isbn").value = book.isbn;
    $("#price").value = book.price;
    $("#publishDate").value = book.publishDate ?? "";
    $("#publisher").value = book.detail ? book.detail.publisher ?? "" : "";

    $("#submitBtn").textContent = "도서 수정";
    $("#cancelBtn").style.display = "inline";

  } catch (err) {
    console.error(err);
    alert("수정 모드 진입 실패: " + err.message);
  }
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
      detailRequest: {   // ✅ detail → detailRequest 로 맞춤
        publisher: $("#publisher").value.trim()
      }
    };

    const valid = validateBook(book);
    if (valid !== true) {
      showError(valid);
      return;
    }

    if (editingBookId) {
      await updateBook(editingBookId, book);
    } else {
      await createBook(book);
    }
  });

  $("#cancelBtn").addEventListener("click", () => {
    form.reset();
    editingBookId = null;
    $("#submitBtn").textContent = "도서 등록";
    $("#cancelBtn").style.display = "none";
    showError("");
  });
}

// ======== 초기화 ========
window.addEventListener("DOMContentLoaded", async () => {
  bindForm();
  await loadBooks();
});