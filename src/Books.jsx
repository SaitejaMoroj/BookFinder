import React, { useState } from "react";
import { Search, Book, User, BookOpen, Loader2, X, Filter } from "lucide-react";
import "./Books.css"; // Manual CSS file

const BookFinder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [filters, setFilters] = useState({
    hasEbook: false,
    yearFrom: "",
    yearTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const searchTypes = [
    { value: "title", label: "Title", icon: Book },
    { value: "author", label: "Author", icon: User },
    { value: "subject", label: "Subject", icon: BookOpen },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setBooks([]);

    try {
      const url = `https://openlibrary.org/search.json?${searchType}=${encodeURIComponent(
        searchQuery
      )}&limit=20`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.docs && data.docs.length > 0) {
        let filteredBooks = data.docs;

        if (filters.hasEbook) {
          filteredBooks = filteredBooks.filter(
            (book) =>
              book.ebook_access === "borrowable" ||
              book.ebook_access === "public"
          );
        }

        if (filters.yearFrom) {
          filteredBooks = filteredBooks.filter(
            (book) =>
              book.first_publish_year &&
              book.first_publish_year >= parseInt(filters.yearFrom)
          );
        }

        if (filters.yearTo) {
          filteredBooks = filteredBooks.filter(
            (book) =>
              book.first_publish_year &&
              book.first_publish_year <= parseInt(filters.yearTo)
          );
        }

        setBooks(filteredBooks);
      } else {
        setError("No books found. Try a different search term.");
      }
    } catch (err) {
      setError("Failed to fetch books. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const getCoverUrl = (book, size = "M") => {
    return book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-${size}.jpg`
      : null;
  };

  const BookCard = ({ book }) => {
    const coverUrl = getCoverUrl(book);
    return (
      <div className="book-card" onClick={() => setSelectedBook(book)}>
        <div className="book-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={book.title} />
          ) : (
            <Book className="placeholder-icon" />
          )}
        </div>
        <div className="book-info">
          <h3>{book.title}</h3>
          <p>{book.author_name ? book.author_name.join(", ") : "Unknown Author"}</p>
          <div className="book-meta">
            <span>{book.first_publish_year || "Unknown"}</span>
            {book.ebook_access !== "no_ebook" && <span className="ebook-tag">eBook</span>}
          </div>
        </div>
      </div>
    );
  };

  const BookModal = ({ book, onClose }) => {
    const coverUrl = getCoverUrl(book, "L");
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Book Details</h2>
            <button onClick={onClose} className="close-btn">
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-left">
              {coverUrl ? (
                <img src={coverUrl} alt={book.title} className="modal-cover" />
              ) : (
                <Book className="placeholder-icon" />
              )}
            </div>

            <div className="modal-right">
              <h3>{book.title}</h3>
              <p className="author">
                {book.author_name ? book.author_name.join(", ") : "Unknown Author"}
              </p>

              <p><strong>First Published:</strong> {book.first_publish_year || "Unknown"}</p>
              <p><strong>Editions:</strong> {book.edition_count || 0}</p>
              <p><strong>Language:</strong> {book.language?.join(", ").toUpperCase() || "N/A"}</p>
              <p><strong>eBook:</strong> {book.ebook_access === "no_ebook" ? "Not Available" : "Available"}</p>

              {book.subject && (
                <div className="subjects">
                  <h4>Subjects:</h4>
                  <div className="tags">
                    {book.subject.slice(0, 10).map((subj, idx) => (
                      <span key={idx} className="tag">
                        {subj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={`https://openlibrary.org${book.key}`}
                target="_blank"
                rel="noreferrer"
                className="view-btn"
              >
                View on Open Library
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bookfinder-container">
      <div className="header">
        <BookOpen size={50} className="header-icon" />
        <h1>Book Finder</h1>
        <p>Discover your next great read</p>
      </div>

      <div className="search-bar">
        {searchTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => setSearchType(type.value)}
              className={`search-type-btn ${
                searchType === type.value ? "active" : ""
              }`}
            >
              <Icon size={20} />
              {type.label}
            </button>
          );
        })}

        <div className="search-input">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Search by ${searchType}...`}
          />
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className="filter-btn">
          <Filter size={18} /> Filters
        </button>

        <button onClick={handleSearch} disabled={loading} className="search-btn">
          {loading ? (
            <>
              <Loader2 className="spin" size={16} /> Searching...
            </>
          ) : (
            "Search"
          )}
        </button>
      </div>

      {showFilters && (
        <div className="filters">
          <label>
            <input
              type="checkbox"
              checked={filters.hasEbook}
              onChange={(e) => setFilters({ ...filters, hasEbook: e.target.checked })}
            />
            eBooks only
          </label>

          <input
            type="number"
            placeholder="Year from"
            value={filters.yearFrom}
            onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
          />
          <input
            type="number"
            placeholder="Year to"
            value={filters.yearTo}
            onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
          />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="book-grid">
        {books.map((book, idx) => (
          <BookCard key={idx} book={book} />
        ))}
      </div>

      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
};

export default BookFinder;
