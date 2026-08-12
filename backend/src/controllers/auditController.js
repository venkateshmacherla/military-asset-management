import pool from "../config/db.js";

// Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        al.id,
        al.user_id,
        u.username,
        u.role,
        al.action,
        al.details,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u
        ON al.user_id = u.id
      ORDER BY al.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

// Get one audit log
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        al.id,
        al.user_id,
        u.username,
        u.role,
        al.action,
        al.details,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u
        ON al.user_id = u.id
      WHERE al.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get audit log error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch audit log",
    });
  }
};
