import pool from "../config/db.js";

/* GET DASHBOARD SUMMARY */

export const getDashboardSummary = async (req, res) => {
  try {
    const [
      basesResult,
      equipmentResult,
      inventoryResult,
      purchasesResult,
      transfersResult,
      assignmentsResult,
      expendituresResult,
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM bases
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM equipment_types
      `),

      pool.query(`
        SELECT
          COALESCE(SUM(quantity), 0)::int AS total_quantity,
          COUNT(*)::int AS inventory_items
        FROM assets
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM purchases
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM transfers
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM assignments
      `),

      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM expenditures
      `),
    ]);

    const lowStockResult = await pool.query(`
      SELECT
        a.id,
        b.name AS base_name,
        et.name AS equipment_name,
        et.category,
        a.quantity
      FROM assets a
      JOIN bases b
        ON a.base_id = b.id
      JOIN equipment_types et
        ON a.equipment_type_id = et.id
      WHERE a.quantity <= 10
      ORDER BY a.quantity ASC
    `);

    res.status(200).json({
      success: true,
      data: {
        totalBases: basesResult.rows[0].total,
        totalEquipmentTypes: equipmentResult.rows[0].total,
        totalInventory: inventoryResult.rows[0].total_quantity,
        inventoryItems: inventoryResult.rows[0].inventory_items,

        totalPurchases: purchasesResult.rows[0].total,
        totalTransfers: transfersResult.rows[0].total,
        totalAssignments: assignmentsResult.rows[0].total,
        totalExpenditures: expendituresResult.rows[0].total,

        lowStockItems: lowStockResult.rows,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

/* GET ALL ASSETS */

export const getAssets = async (req, res) => {
  try {
    const { baseId, category, search } = req.query;

    let query = `
      SELECT
        a.id,
        a.base_id,
        b.name AS base_name,
        b.location AS base_location,

        a.equipment_type_id,
        et.name AS equipment_name,
        et.category,

        a.quantity,
        a.created_at,
        a.updated_at

      FROM assets a

      INNER JOIN bases b
        ON a.base_id = b.id

      INNER JOIN equipment_types et
        ON a.equipment_type_id = et.id

      WHERE 1 = 1
    `;

    const values = [];

    if (baseId) {
      values.push(baseId);
      query += ` AND a.base_id = $${values.length}`;
    }

    if (category) {
      values.push(category);
      query += ` AND et.category = $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);

      query += `
        AND (
          et.name ILIKE $${values.length}
          OR b.name ILIKE $${values.length}
        )
      `;
    }

    query += `
      ORDER BY b.name ASC, et.name ASC
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get assets error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assets",
    });
  }
};

/* GET SINGLE ASSET */

export const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.base_id,
        b.name AS base_name,
        b.location AS base_location,

        a.equipment_type_id,
        et.name AS equipment_name,
        et.category,

        a.quantity,
        a.created_at,
        a.updated_at

      FROM assets a

      INNER JOIN bases b
        ON a.base_id = b.id

      INNER JOIN equipment_types et
        ON a.equipment_type_id = et.id

      WHERE a.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get asset error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch asset",
    });
  }
};

/* CREATE / ADD INVENTORY */

export const createAsset = async (req, res) => {
  const client = await pool.connect();

  try {
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Request body:", req.body);

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

    const result = await client.query(
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

    await client.query(
      `
      INSERT INTO purchases (
        base_id,
        equipment_type_id,
        quantity,
        created_by
      )
      VALUES ($1, $2, $3, $4)
      `,
      [baseId, equipmentTypeId, quantity, req.user.id],
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
        "INVENTORY_ADDED",
        `Added ${quantity} units of equipment type ${equipmentTypeId} to base ${baseId}`,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Inventory added successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create asset error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add inventory",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/* UPDATE INVENTORY QUANTITY */

export const updateAssetQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
    }

    if (Number(quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    const result = await pool.query(
      `
      UPDATE assets
      SET
        quantity = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2

      RETURNING *
      `,
      [quantity, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
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
      [
        req.user.id,
        "INVENTORY_UPDATED",
        `Updated asset ${id} quantity to ${quantity}`,
      ],
    );

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update asset error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update inventory",
    });
  }
};

/* DELETE INVENTORY RECORD */

export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM assets
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
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
      [req.user.id, "INVENTORY_DELETED", `Deleted asset ${id}`],
    );

    res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    console.error("Delete asset error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete inventory",
    });
  }
};
