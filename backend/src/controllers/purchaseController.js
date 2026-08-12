import pool from "../config/db.js";

// Get all purchase records
export const getPurchases = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,

        p.base_id,
        b.name AS base_name,
        b.location AS base_location,

        p.equipment_type_id,
        et.name AS equipment_name,
        et.category,

        p.quantity,

        p.created_by,
        u.username AS created_by_username,

        p.created_at

      FROM purchases p

      INNER JOIN bases b
        ON p.base_id = b.id

      INNER JOIN equipment_types et
        ON p.equipment_type_id = et.id

      LEFT JOIN users u
        ON p.created_by = u.id

      ORDER BY p.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get purchases error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
    });
  }
};

// Get a single purchase record by ID
export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.id,

        p.base_id,
        b.name AS base_name,
        b.location AS base_location,

        p.equipment_type_id,
        et.name AS equipment_name,
        et.category,

        p.quantity,

        p.created_by,
        u.username AS created_by_username,

        p.created_at

      FROM purchases p

      INNER JOIN bases b
        ON p.base_id = b.id

      INNER JOIN equipment_types et
        ON p.equipment_type_id = et.id

      LEFT JOIN users u
        ON p.created_by = u.id

      WHERE p.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get purchase error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase",
    });
  }
};

// Create a new purchase record and update inventory accordingly
export const createPurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    const { baseId, equipmentTypeId, quantity } = req.body || {};

    if (!baseId || !equipmentTypeId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "baseId, equipmentTypeId and quantity are required",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    await client.query("BEGIN");

    // Make sure the base exists.
    const baseResult = await client.query(
      `
      SELECT id
      FROM bases
      WHERE id = $1
      `,
      [baseId],
    );

    if (baseResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Base not found",
      });
    }

    // Make sure the equipment type exists.
    const equipmentResult = await client.query(
      `
      SELECT id
      FROM equipment_types
      WHERE id = $1
      `,
      [equipmentTypeId],
    );

    if (equipmentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    // Add the purchased quantity to inventory.
    const assetResult = await client.query(
      `
      INSERT INTO assets (
        base_id,
        equipment_type_id,
        quantity
      )
      VALUES ($1, $2, $3)

      ON CONFLICT (base_id, equipment_type_id)
      DO UPDATE SET
        quantity = assets.quantity + EXCLUDED.quantity,
        updated_at = CURRENT_TIMESTAMP

      RETURNING *
      `,
      [baseId, equipmentTypeId, quantity],
    );

    // Record the purchase.
    const purchaseResult = await client.query(
      `
      INSERT INTO purchases (
        base_id,
        equipment_type_id,
        quantity,
        created_by
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [baseId, equipmentTypeId, quantity, req.user.id],
    );

    // Record the action for auditing.
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
        "PURCHASE_CREATED",
        `Purchased ${quantity} units of equipment ${equipmentTypeId} for base ${baseId}`,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: {
        purchase: purchaseResult.rows[0],
        inventory: assetResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create purchase error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create purchase",
    });
  } finally {
    client.release();
  }
};
