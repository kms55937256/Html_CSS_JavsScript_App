// ======== 설정 ========
const API_BASE = "http://localhost:8080/api/books"; // SpringBoot 컨트롤러(@RequestMapping("/api/books"))와 일치

// ======== 유틸 ========
function $(sel) { return document.querySelector(sel); }
function showError(msg) {
  const el = $("#formError");
  el.textContent = msg || "";
  el.style.display = msg ? "inline" : "none";
}

// ======== 1) 입력값 검증 ========
/**
 * 실습 요구사항: 입력 데이터 값을 검증하는 validateBook() 함수
 * @param {{title:string, author:string, isbn:string, price:number|string, publishDate?:string}} book
 * @returns {true | string}  true면 통과, string이면 에러 메시지
 */
function validateBook(book) {
  if (!book.title || book.title.trim() === "") return "제목은 필수입니다.";
  if (!book.author || book.author.trim() === "") return "저자는 필수입니다.";
  if (!book.isbn || book.isbn.trim() === "") return "ISBN은 필수입니다.";

  // 가격: 정수/양수
  if (book.price === "" || book.price === null || book.price === undefined) {
    return "가격은 필수입니다.";
  }
  const priceNum = Number(book.price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) return "가격은 0보다 큰 숫자여야 합니다.";

  // 출판일(선택) — 값이 있으면 YYYY-MM-DD 형태인지 정도만 체크
  if (book.publishDate && !/^\d{4}-\d{2}-\d{2}$/.test(book.publishDate)) {
    return "출판일 형식이 올바르지 않습니다. (예: 2025-05-07)";
  }

  return true;
}

// ======== 2) 목록 가져오기 + 렌더 ========
/**
 * fetch()로 백엔드에서 책 목록을 가져와 화면에 출력
 * 실습 요구사항: loadBooks() & renderBookTable(books)
 */
async function loadBooks() {
  try {
    const resp = await fetch(API_BASE, { method: "GET" });
    if (!resp.ok) throw new Error(`목록 조회 실패: ${resp.status}`);
    const books = await resp.json();
    renderBookTable(books);
  } catch (err) {
    console.error(err);
    alert("도서 목록을 불러오지 못했습니다.");
  }
}

/**
 * <tbody>에 행 렌더링
 * @param {Array<{id:number,title:string,author:string,isbn:string,price:number,publishDate?:string}>} books
 */
function renderBookTable(books) {
  const tbody = $("#bookTableBody");
  tbody.innerHTML = "";

  books.forEach(b => {
    const tr = document.createElement("tr");

    const tTitle = document.createElement("td");
    tTitle.textContent = b.title;

    const tAuthor = document.createElement("td");
    tAuthor.textContent = b.author;

    const tIsbn = document.createElement("td");
    tIsbn.textContent = b.isbn;

    const tPrice = document.createElement("td");
    tPrice.textContent = new Intl.NumberFormat("ko-KR").format(b.price);

    const tDate = document.createElement("td");
    tDate.textContent = b.publishDate ?? "";

    const tAction = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "삭제";
    delBtn.onclick = () => deleteBook(b.id);
    tAction.appendChild(delBtn);

    tr.append(tTitle, tAuthor, tIsbn, tPrice, tDate, tAction);
    tbody.appendChild(tr);
  });
}

// ======== 등록(POST) ========
async function addBook(book) {
  try {
    const resp = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });

    if (resp.status === 201 || resp.ok) {
      showError("");
      $("#bookForm").reset();
      await loadBooks();
    } else {
      const errJson = await resp.json().catch(() => ({}));
      const msg = errJson?.message || `등록 실패: ${resp.status}`;
      showError(msg);
    }
  } catch (err) {
    console.error(err);
    showError("서버 통신 중 오류가 발생했습니다.");
  }
}

// ======== 삭제(DELETE) ========
async function deleteBook(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  try {
    const resp = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (resp.status === 204 || resp.ok) {
      await loadBooks();
    } else {
      const errJson = await resp.json().catch(() => ({}));
      alert(errJson?.message || `삭제 실패: ${resp.status}`);
    }
  } catch (err) {
    console.error(err);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

// ======== 폼 바인딩 ========
function bindForm() {
  const form = $("#bookForm");
  const cancelBtn = $("#cancelBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const book = {
      title: $("#title").value.trim(),
      author: $("#author").value.trim(),
      isbn: $("#isbn").value.trim(),
      price: $("#price").value.trim(),
      publishDate: $("#publishDate").value || null
    };

    const valid = validateBook(book);
    if (valid !== true) {
      showError(valid);
      return;
    }

    showError("");
    await addBook(book);
  });

  // (추후 수정 기능 붙이면 보이도록 사용)
  cancelBtn.addEventListener("click", () => {
    form.reset();
    showError("");
    cancelBtn.style.display = "none";
  });
}

// ======== 초기화 ========
window.addEventListener("DOMContentLoaded", async () => {
  bindForm();
  await loadBooks(); // 처음 진입 시 목록 로딩
});