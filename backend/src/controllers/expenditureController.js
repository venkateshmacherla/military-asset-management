import pool from "../config/db.js";

// Get all expenditures
export const getExpenditures = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.id,
        e.base_id,
        b.name AS base_name,
        e.equipment_type_id,
        et.name AS equipment_name,
        et.category,
        e.quantity,
        e.reason,
        e.created_by,
        u.username AS created_by_username,
        e.created_at
      FROM expenditures e
      INNER JOIN bases b
        ON e.base_id = b.id
      INNER JOIN equipment_types et
        ON e.equipment_type_id = et.id
      LEFT JOIN users u
        ON e.created_by = u.id
      ORDER BY e.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get expenditures error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch expenditures",
    });
  }
};

// Get one expenditure
export const getExpenditureById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.base_id,
        b.name AS base_name,
        e.equipment_type_id,
        et.name AS equipment_name,
        et.category,
        e.quantity,
        e.reason,
        e.created_by,
        u.username AS created_by_username,
        e.created_at
      FROM expenditures e
      INNER JOIN bases b
        ON e.base_id = b.id
      INNER JOIN equipment_types et
        ON e.equipment_type_id = et.id
      LEFT JOIN users u
        ON e.created_by = u.id
      WHERE e.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Expenditure not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get expenditure error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch expenditure",
    });
  }
};

// Create expenditure
export const createExpenditure = async (req, res) => {
  const client = await pool.connect();

  try {
    const { baseId, equipmentTypeId, quantity, reason } = req.body || {};

    if (!baseId || !equipmentTypeId || quantity === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: "baseId, equipmentTypeId, quantity and reason are required",
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
        message: "Inventory not found",
      });
    }

    const asset = assetResult.rows[0];

    if (Number(asset.quantity) < Number(quantity)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient inventory",
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

    const result = await client.query(
      `
      INSERT INTO expenditures (
        base_id,
        equipment_type_id,
        quantity,
        reason,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [baseId, equipmentTypeId, quantity, reason.trim(), req.user.id],
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
        "INVENTORY_EXPENDED",
        `Expended ${quantity} units of equipment ${equipmentTypeId} at base ${baseId}`,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Expenditure recorded successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create expenditure error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create expenditure",
    });
  } finally {
    client.release();
  }
};
