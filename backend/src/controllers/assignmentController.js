import pool from "../config/db.js";

// Get all assignments
export const getAssignments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.base_id,
        b.name AS base_name,
        a.equipment_type_id,
        et.name AS equipment_name,
        et.category,
        a.quantity,
        a.assigned_to,
        a.created_by,
        u.username AS created_by_username,
        a.created_at
      FROM assignments a
      INNER JOIN bases b
        ON a.base_id = b.id
      INNER JOIN equipment_types et
        ON a.equipment_type_id = et.id
      LEFT JOIN users u
        ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get assignments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
    });
  }
};

// Get one assignment
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.base_id,
        b.name AS base_name,
        a.equipment_type_id,
        et.name AS equipment_name,
        et.category,
        a.quantity,
        a.assigned_to,
        a.created_by,
        u.username AS created_by_username,
        a.created_at
      FROM assignments a
      INNER JOIN bases b
        ON a.base_id = b.id
      INNER JOIN equipment_types et
        ON a.equipment_type_id = et.id
      LEFT JOIN users u
        ON a.created_by = u.id
      WHERE a.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assignment",
    });
  }
};

// Create assignment
export const createAssignment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { baseId, equipmentTypeId, quantity, assignedTo } = req.body || {};

    if (!baseId || !equipmentTypeId || quantity === undefined || !assignedTo) {
      return res.status(400).json({
        success: false,
        message:
          "baseId, equipmentTypeId, quantity and assignedTo are required",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    await client.query("BEGIN");

    const assetResult = await client.query(
      `
      SELECT id, quantity
      FROM assets
      WHERE base_id = $1
        AND equipment_type_id = $2
      FOR UPDATE
      `,
      [baseId, equipmentTypeId],
    );

    if (assetResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Inventory not found for this base and equipment",
      });
    }

    const asset = assetResult.rows[0];

    if (Number(asset.quantity) < Number(quantity)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient inventory for this assignment",
      });
    }

    await client.query(
      `
      UPDATE assets
      SET
        quantity = quantity - $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [quantity, asset.id],
    );

    const assignmentResult = await client.query(
      `
      INSERT INTO assignments (
        base_id,
        equipment_type_id,
        quantity,
        assigned_to,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [baseId, equipmentTypeId, quantity, assignedTo, req.user.id],
    );

    await client.query(
      `
      INSERT INTO audit_logs (
        user_id,
        action,
        details
      )
      VALUES ($1, $2, $3)
      `,
      [
        req.user.id,
        "INVENTORY_ASSIGNED",
        `Assigned ${quantity} units of equipment ${equipmentTypeId} to ${assignedTo} at base ${baseId}`,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Equipment assigned successfully",
      data: assignmentResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create assignment",
    });
  } finally {
    client.release();
  }
};

// Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, quantity } = req.body || {};

    if (!assignedTo && quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "assignedTo or quantity is required",
      });
    }

    if (quantity !== undefined && Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    const currentResult = await pool.query(
      `
      SELECT *
      FROM assignments
      WHERE id = $1
      `,
      [id],
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const current = currentResult.rows[0];

    const newQuantity = quantity === undefined ? current.quantity : quantity;

    const newAssignedTo =
      assignedTo === undefined ? current.assigned_to : assignedTo;

    const result = await pool.query(
      `
      UPDATE assignments
      SET
        quantity = $1,
        assigned_to = $2
      WHERE id = $3
      RETURNING *
      `,
      [newQuantity, newAssignedTo, id],
    );

    await pool.query(
      `
      INSERT INTO audit_logs (
        user_id,
        action,
        details
      )
      VALUES ($1, $2, $3)
      `,
      [req.user.id, "ASSIGNMENT_UPDATED", `Updated assignment ${id}`],
    );

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update assignment",
    });
  }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM assignments
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    await pool.query(
      `
      INSERT INTO audit_logs (
        user_id,
        action,
        details
      )
      VALUES ($1, $2, $3)
      `,
      [req.user.id, "ASSIGNMENT_DELETED", `Deleted assignment ${id}`],
    );

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete assignment",
    });
  }
};
