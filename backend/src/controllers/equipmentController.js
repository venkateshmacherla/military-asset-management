import pool from "../config/db.js";

// Get all equipment types
export const getEquipmentTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        et.id,
        et.name,
        et.category,
        et.created_at,

        COUNT(a.id)::int AS inventory_items,
        COALESCE(SUM(a.quantity), 0)::int AS total_quantity

      FROM equipment_types et

      LEFT JOIN assets a
        ON et.id = a.equipment_type_id

      GROUP BY
        et.id,
        et.name,
        et.category,
        et.created_at

      ORDER BY et.name ASC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get equipment types error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch equipment types",
    });
  }
};

// Get one equipment type
export const getEquipmentTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        et.id,
        et.name,
        et.category,
        et.created_at,

        COUNT(a.id)::int AS inventory_items,
        COALESCE(SUM(a.quantity), 0)::int AS total_quantity

      FROM equipment_types et

      LEFT JOIN assets a
        ON et.id = a.equipment_type_id

      WHERE et.id = $1

      GROUP BY
        et.id,
        et.name,
        et.category,
        et.created_at
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get equipment type error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch equipment type",
    });
  }
};

// Create a new equipment type
export const createEquipmentType = async (req, res) => {
  try {
    const { name, category } = req.body || {};

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "Name and category are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO equipment_types (
        name,
        category
      )
      VALUES ($1, $2)
      RETURNING *
      `,
      [name.trim(), category.trim()],
    );

    res.status(201).json({
      success: true,
      message: "Equipment type created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create equipment type error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This equipment type already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create equipment type",
    });
  }
};

// Update an existing equipment type
export const updateEquipmentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body || {};

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "Name and category are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE equipment_types
      SET
        name = $1,
        category = $2
      WHERE id = $3
      RETURNING *
      `,
      [name.trim(), category.trim(), id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Equipment type updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update equipment type error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This equipment type already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update equipment type",
    });
  }
};

// Delete an equipment type
export const deleteEquipmentType = async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryResult = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM assets
      WHERE equipment_type_id = $1
      `,
      [id],
    );

    if (inventoryResult.rows[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete an equipment type that is used by inventory",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM equipment_types
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Equipment type deleted successfully",
    });
  } catch (error) {
    console.error("Delete equipment type error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete equipment type",
    });
  }
};
