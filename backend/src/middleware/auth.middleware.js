const { verifyToken } = require('../services/auth.service');

function requireAuth(role) {
  return (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Unauthenticated' });

    try {
      const payload = verifyToken(token);
      if (role && payload.role !== role) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  };
}

module.exports = { requireAuth };
