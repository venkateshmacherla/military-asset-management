import pool from "../config/db.js";

// Get all bases
export const getBases = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.id,
        b.name,
        b.location,
        b.created_at,

        COUNT(a.id)::int AS inventory_items,
        COALESCE(SUM(a.quantity), 0)::int AS total_inventory

      FROM bases b

      LEFT JOIN assets a
        ON b.id = a.base_id

      GROUP BY
        b.id,
        b.name,
        b.location,
        b.created_at

      ORDER BY b.name ASC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get bases error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bases",
    });
  }
};

/*
 Get one base
 */
export const getBaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.name,
        b.location,
        b.created_at,

        COUNT(a.id)::int AS inventory_items,
        COALESCE(SUM(a.quantity), 0)::int AS total_inventory

      FROM bases b

      LEFT JOIN assets a
        ON b.id = a.base_id

      WHERE b.id = $1

      GROUP BY
        b.id,
        b.name,
        b.location,
        b.created_at
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Base not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get base error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch base",
    });
  }
};

/*
 * Create a new base
 */
export const createBase = async (req, res) => {
  try {
    const { name, location } = req.body || {};

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: "Name and location are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO bases (
        name,
        location
      )
      VALUES ($1, $2)
      RETURNING *
      `,
      [name.trim(), location.trim()],
    );

    res.status(201).json({
      success: true,
      message: "Base created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create base error:", error);

    /*
     PostgreSQL error code 23505 means a unique constraint
     was violated.
     */
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A base with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create base",
    });
  }
};

/*
Update an existing base
 */
export const updateBase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body || {};

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: "Name and location are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE bases
      SET
        name = $1,
        location = $2
      WHERE id = $3
      RETURNING *
      `,
      [name.trim(), location.trim(), id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Base not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Base updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update base error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A base with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update base",
    });
  }
};

/*
Delete a base
We don't allow deletion when the base still has inventory
because deleting it could break the inventory relationships.
 */
export const deleteBase = async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryResult = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM assets
      WHERE base_id = $1
      `,
      [id],
    );

    if (inventoryResult.rows[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete a base that has inventory records",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM bases
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Base not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Base deleted successfully",
    });
  } catch (error) {
    console.error("Delete base error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete base",
    });
  }
};
