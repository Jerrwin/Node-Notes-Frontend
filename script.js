const API_BASE_URL = "http://localhost:5000/api";
let currentEditId = null;

window.addEventListener("DOMContentLoaded", () => {
  fetchNotes();
});

async function fetchNotes() {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/getAll`);
    const data = await response.json();

    if (data.notes && data.notes.length > 0) {
      displayNotes(data.notes);
    } else {
      displayEmptyState();
    }
  } catch (error) {
    showMessage(
      "error",
      "Failed to fetch notes. Make sure the backend is running."
    );
  }
}

function displayNotes(notes) {
  const container = document.getElementById("notesContainer");
  container.innerHTML = notes
    .map(
      (note, index) => `
                    <div class="note-card" style="--index: ${index}">
                        <div class="note-header">
                            <h3 class="note-title">${escapeHtml(
                              note.title
                            )}</h3>
                            <div class="note-actions">
                                <button class="btn-icon btn-primary" onclick="editNote('${
                                  note.id
                                }')" title="Edit">
                                    ✏️
                                </button>
                                <button class="btn-icon btn-danger" onclick="deleteNote('${
                                  note.id
                                }')" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <p class="note-content">${escapeHtml(note.content)}</p>
                        ${
                          note.tags
                            ? `
                            <div class="note-tags">
                                ${note.tags
                                  .split(",")
                                  .map(
                                    (tag) =>
                                      `<span class="tag">${escapeHtml(
                                        tag.trim()
                                      )}</span>`
                                  )
                                  .join("")}
                            </div>
                        `
                            : ""
                        }
                        <div class="note-meta">
                            <div>Created: ${note.createdAt}</div>
                            <div>Updated: ${
                              note.LastUpdatedAt || note.updatedAt
                            }</div>
                        </div>
                    </div>
                `
    )
    .join("");
}

function displayEmptyState() {
  const container = document.getElementById("notesContainer");
  container.innerHTML = `
                <div class="empty-state">
                    <h3>No notes yet</h3>
                    <p>Create your first note to get started!</p>
                </div>
            `;
}

async function searchNotes() {
  const searchInput = document.getElementById("searchInput").value.trim();
  const searchType = document.querySelector(
    'input[name="searchType"]:checked'
  ).value;

  if (!searchInput) {
    showMessage("error", "Please enter a search term");
    return;
  }

  try {
    let url;
    if (searchType === "title") {
      url = `${API_BASE_URL}/notes/search?title=${encodeURIComponent(
        searchInput
      )}`;
    } else {
      url = `${API_BASE_URL}/notes/search/tags?tag=${encodeURIComponent(
        searchInput
      )}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.notes && data.notes.length > 0) {
      displayNotes(data.notes);
      showMessage("success", `Found ${data.notes.length} note(s)`);
    } else {
      displayEmptyState();
      showMessage("info", "No notes found");
    }
  } catch (error) {
    showMessage("error", "Search failed");
  }
}

function resetSearch() {
  document.getElementById("searchInput").value = "";
  fetchNotes();
}

function openModal(isEdit = false) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const submitBtn = document.getElementById("submitBtn");

  if (isEdit) {
    modalTitle.textContent = "Edit Note";
    submitBtn.textContent = "Update Note";
  } else {
    modalTitle.textContent = "Create New Note";
    submitBtn.textContent = "Create Note";
    document.getElementById("noteForm").reset();
    currentEditId = null;
  }

  modal.classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
  document.getElementById("noteForm").reset();
  currentEditId = null;
}

async function handleSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("noteTitle").value.trim();
  const content = document.getElementById("noteContent").value.trim();
  const tagsInput = document.getElementById("noteTags").value.trim();
  const tags = tagsInput
    ? tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
    : [];

  const noteData = { title, content, tags };

  try {
    if (currentEditId) {
      const response = await fetch(
        `${API_BASE_URL}/notes/update/${currentEditId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noteData),
        }
      );

      if (response.ok) {
        showMessage("success", "Note updated successfully");
        closeModal();
        fetchNotes();
      } else {
        const data = await response.json();
        showMessage("error", data.message || "Failed to update note");
      }
    } else {
      const response = await fetch(`${API_BASE_URL}/notes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        showMessage("success", "Note created successfully");
        closeModal();
        fetchNotes();
      } else {
        const data = await response.json();
        showMessage("error", data.message || "Failed to create note");
      }
    }
  } catch (error) {
    showMessage("error", "Operation failed. Check your connection.");
  }
}

async function editNote(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/getAll`);
    const data = await response.json();
    const note = data.notes.find((n) => n.id === id);

    if (note) {
      currentEditId = id;
      document.getElementById("noteTitle").value = note.title;
      document.getElementById("noteContent").value = note.content;
      document.getElementById("noteTags").value = note.tags || "";
      openModal(true);
    }
  } catch (error) {
    showMessage("error", "Failed to load note");
  }
}

async function deleteNote(id) {
  if (!confirm("Are you sure you want to delete this note?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/notes/delete/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showMessage("success", "Note deleted successfully");
      fetchNotes();
    } else {
      showMessage("error", "Failed to delete note");
    }
  } catch (error) {
    showMessage("error", "Delete operation failed");
  }
}

function showMessage(type, text) {
  const messageEl = document.getElementById("message");
  messageEl.className = `message ${type} show`;
  messageEl.textContent = text;

  setTimeout(() => {
    messageEl.classList.remove("show");
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") {
    closeModal();
  }
});
