// Create a new file: services/PaginationService.js
class PaginationService {
  /**
   * Process pagination parameters from request
   * @param {object} req - Express request object
   * @returns {object} - Pagination parameters
   */
  static getParams(req) {
    const { page = 1, limit = 20 } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset,
    };
  }

  /**
   * Create pagination result object
   * @param {Array} data - Result data array
   * @param {number} total - Total count of items
   * @param {object} params - Pagination parameters from getParams()
   * @returns {object} - Formatted pagination result
   */
  static createResult(data, total, params) {
    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasMore: params.page * params.limit < total,
      },
    };
  }

  /**
   * Process cursor-based pagination
   * @param {object} req - Express request object
   * @returns {object} - Cursor pagination parameters
   */
  static getCursorParams(req) {
    const { cursor, limit = 20, direction = "before" } = req.query;

    const parsedLimit = parseInt(limit, 10);
    const isForward = direction !== "before";

    return {
      cursor,
      limit: parsedLimit,
      direction,
      isForward,
      operator: isForward ? ">" : "<",
      orderDir: isForward ? "ASC" : "DESC",
    };
  }

  /**
   * Create cursor pagination result
   * @param {Array} data - Result data array
   * @param {object} params - Cursor parameters from getCursorParams()
   * @param {string} idField - Field name for cursor ID
   * @returns {object} - Formatted cursor result
   */
  static createCursorResult(data, params, idField = "id") {
    // If fetching older messages and direction is "before", reverse to maintain chronological order
    const results = params.direction === "before" ? [...data].reverse() : data;

    return {
      data: results,
      cursor: {
        next: results.length ? results[results.length - 1][idField] : null,
        prev: results.length ? results[0][idField] : null,
        hasMore: results.length >= params.limit,
      },
    };
  }
}

export default PaginationService;
