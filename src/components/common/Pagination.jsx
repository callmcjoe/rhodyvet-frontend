const Pagination = ({ page, pages, total, onPageChange }) => {
  // Always show pagination info, but only show navigation when more than 1 page
  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t">
      <p className="text-sm text-gray-500">
        Showing page {page} of {pages} ({total} total)
      </p>
      {pages > 1 && (
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
