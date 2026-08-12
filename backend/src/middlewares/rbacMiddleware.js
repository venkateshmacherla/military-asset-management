// middlewares/rbacMiddleware.js

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied: Insufficient authorization level.",
      });
    }
    next();
  };
};

export const enforceBaseScope = (req, res, next) => {
  if (req.user?.role === "BASE_COMMANDER") {
    req.query.baseId = String(req.user.baseId);
    if (req.body && typeof req.body === "object") {
      if ("baseId" in req.body) req.body.baseId = req.user.baseId;
      if ("sourceBaseId" in req.body) req.body.sourceBaseId = req.user.baseId;
    }
  }
  next();
};
