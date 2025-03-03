import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is required" });
  }

  try {
    // Verify the token and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
