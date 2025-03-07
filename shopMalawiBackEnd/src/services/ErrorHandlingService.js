//src/services/ErrorHandlingService.js
class ErrorHandlingService {
  static DatabaseError = class extends Error {
    constructor(message, query) {
      super(message);
      this.name = "DatabaseError";
      this.query = query;
    }
  };

  static ValidationError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "ValidationError";
    }
  };

  static handleError(error, res) {
    console.error(
      `[${new Date().toISOString()}] ${error.name}: ${error.message}`
    );

    if (error instanceof this.ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof this.DatabaseError) {
      return res.status(500).json({ error: "Database operation failed" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default ErrorHandlingService;
