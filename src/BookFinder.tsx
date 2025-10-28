import React, { useState } from 'react';
import { Search, Book, User, BookOpen, Loader2, X, Filter } from 'lucide-react';

interface Book {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  ebook_access?: string;
  edition_count?: number;
  language?: string[];
  subject?: string[];
  publisher?: string[];
}

interface Filters {
  hasEbook: boolean;
  yearFrom: string;
  yearTo: string;
}

interface SearchType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BookFinder: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('title');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [filters, setFilters] = useState<Filters>({
    hasEbook: false,
    yearFrom: '',
    yearTo: ''
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const searchTypes: SearchType[] = [
    { value: 'title', label: 'Title', icon: Book },
    { value: 'author', label: 'Author', icon: User },
    { value: 'subject', label: 'Subject', icon: BookOpen }
  ];

  const handleSearch = async (): Promise<void> => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setBooks([]);

    try {
      const url = `https://openlibrary.org/search.json?${searchType}=${encodeURIComponent(searchQuery)}&limit=20`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.docs && data.docs.length > 0) {
        let filteredBooks = data.docs;

        if (filters.hasEbook) {
          filteredBooks = filteredBooks.filter((book: Book) => 
            book.ebook_access === 'borrowable' || book.ebook_access === 'public'
          );
        }

        if (filters.yearFrom) {
          filteredBooks = filteredBooks.filter((book: Book) => 
            book.first_publish_year && book.first_publish_year >= parseInt(filters.yearFrom)
          );
        }

        if (filters.yearTo) {
          filteredBooks = filteredBooks.filter((book: Book) => 
            book.first_publish_year && book.first_publish_year <= parseInt(filters.yearTo)
          );
        }

        setBooks(filteredBooks);
      } else {
        setError('No books found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to fetch books. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getCoverUrl = (book: Book, size: string = 'M'): string | null => {
    if (book.cover_i) {
      return `https://covers.openlibrary.org/b/id/${book.cover_i}-${size}.jpg`;
    }
    return null;
  };

  const BookCard: React.FC<{ book: Book }> = ({ book }) => {
    const coverUrl = getCoverUrl(book);
    
    return (
      <div 
        onClick={() => setSelectedBook(book)}
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
      >
        <div className="h-64 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={book.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Book className="w-24 h-24 text-indigo-300" />
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            {book.author_name ? book.author_name.slice(0, 2).join(', ') : 'Unknown Author'}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {book.first_publish_year || 'Year unknown'}
            </span>
            {book.ebook_access !== 'no_ebook' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                eBook
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BookModal: React.FC<{ book: Book; onClose: () => void }> = ({ book, onClose }) => {
    const coverUrl = getCoverUrl(book, 'L');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Book Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg p-4 flex items-center justify-center" style={{minHeight: '400px'}}>
                  {coverUrl ? (
                    <img src={coverUrl} alt={book.title} className="rounded shadow-lg max-h-96" />
                  ) : (
                    <Book className="w-32 h-32 text-indigo-300" />
                  )}
                </div>
              </div>
              
              <div className="md:w-2/3 space-y-4">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">{book.title}</h3>
                  <p className="text-xl text-gray-600">
                    by {book.author_name ? book.author_name.join(', ') : 'Unknown Author'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">First Published</p>
                    <p className="font-semibold">{book.first_publish_year || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Editions</p>
                    <p className="font-semibold">{book.edition_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Language</p>
                    <p className="font-semibold">{book.language ? book.language.slice(0, 3).join(', ').toUpperCase() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">eBook Status</p>
                    <p className="font-semibold">
                      {book.ebook_access === 'no_ebook' ? 'Not Available' : 'Available'}
                    </p>
                  </div>
                </div>

                {book.subject && book.subject.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {book.subject.slice(0, 10).map((subject, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {book.publisher && book.publisher.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Publishers</p>
                    <p className="text-sm">{book.publisher.slice(0, 3).join(', ')}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <a 
                    href={`https://openlibrary.org${book.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                  >
                    View on Open Library
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-800">Book Finder</h1>
          </div>
          <p className="text-gray-600 text-lg">Discover your next great read</p>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex gap-2 mb-4">
              {searchTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSearchType(type.value)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                      searchType === type.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {type.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Search by ${searchType}...`}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-xl font-semibold transition flex items-center gap-2 ${
                  showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold disabled:bg-gray-400 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>

            {showFilters && (
              <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasEbook}
                      onChange={(e) => setFilters({...filters, hasEbook: e.target.checked})}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700">eBooks only</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year from</label>
                  <input
                    type="number"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
                    placeholder="e.g., 1990"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year to</label>
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
                    placeholder="e.g., 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {books.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <p className="text-gray-600 text-lg">
                Found <span className="font-bold text-indigo-600">{books.length}</span> books
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book, index) => (
                <BookCard key={`${book.key}-${index}`} book={book} />
              ))}
            </div>
          </div>
        )}

        {selectedBook && (
          <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </div>
    </div>
  );
};

export default BookFinder;