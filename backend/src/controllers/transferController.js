import pool from "../config/db.js";

/*
  Create a new transfer
 */
export const createTransfer = async (req, res) => {
  const client = await pool.connect();

  try {
    const { fromBaseId, toBaseId, equipmentTypeId, quantity, remarks } =
      req.body || {};

    // Basic request validation
    if (
      !fromBaseId ||
      !toBaseId ||
      !equipmentTypeId ||
      quantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "fromBaseId, toBaseId, equipmentTypeId and quantity are required",
      });
    }

    if (Number(fromBaseId) === Number(toBaseId)) {
      return res.status(400).json({
        success: false,
        message: "Source and destination bases must be different",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    await client.query("BEGIN");

    // Check the source inventory
    const sourceResult = await client.query(
      `
      SELECT id, quantity
      FROM assets
      WHERE base_id = $1
        AND equipment_type_id = $2
      FOR UPDATE
      `,
      [fromBaseId, equipmentTypeId],
    );

    if (sourceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Source inventory not found",
      });
    }

    const sourceAsset = sourceResult.rows[0];

    // Make sure the source base has enough inventory
    if (Number(sourceAsset.quantity) < Number(quantity)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient inventory at source base",
      });
    }

    // Make sure both bases exist
    const baseResult = await client.query(
      `
      SELECT id
      FROM bases
      WHERE id IN ($1, $2)
      `,
      [fromBaseId, toBaseId],
    );

    if (baseResult.rows.length !== 2) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Source or destination base not found",
      });
    }

    // Reduce inventory at the source
    await client.query(
      `
      UPDATE assets
      SET
        quantity = quantity - $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [quantity, sourceAsset.id],
    );

    // Add inventory to destination.
    // If the destination does not have this equipment yet,
    // create the inventory record.
    const destinationResult = await client.query(
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
      [toBaseId, equipmentTypeId, quantity],
    );

    // Store the transfer history
    const transferResult = await client.query(
      `
      INSERT INTO transfers (
        from_base_id,
        to_base_id,
        equipment_type_id,
        quantity,
        remarks,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        fromBaseId,
        toBaseId,
        equipmentTypeId,
        quantity,
        remarks || null,
        req.user.id,
      ],
    );

    // Keep an audit trail
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
        "INVENTORY_TRANSFERRED",
        `Transferred ${quantity} units of equipment ${equipmentTypeId} from base ${fromBaseId} to base ${toBaseId}`,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Inventory transferred successfully",
      data: {
        transfer: transferResult.rows[0],
        destinationInventory: destinationResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create transfer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create transfer",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/*
 * Get all transfers
 */
export const getTransfers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,

        t.from_base_id,
        fb.name AS from_base_name,

        t.to_base_id,
        tb.name AS to_base_name,

        t.equipment_type_id,
        et.name AS equipment_name,
        et.category,

        t.quantity,
        t.remarks,
        t.created_by,
        u.username AS created_by_username,

        t.created_at

      FROM transfers t

      INNER JOIN bases fb
        ON t.from_base_id = fb.id

      INNER JOIN bases tb
        ON t.to_base_id = tb.id

      INNER JOIN equipment_types et
        ON t.equipment_type_id = et.id

      LEFT JOIN users u
        ON t.created_by = u.id

      ORDER BY t.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get transfers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transfers",
    });
  }
};

/*
 * Get a single transfer by ID
 */
export const getTransferById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        t.id,

        t.from_base_id,
        fb.name AS from_base_name,

        t.to_base_id,
        tb.name AS to_base_name,

        t.equipment_type_id,
        et.name AS equipment_name,
        et.category,

        t.quantity,
        t.remarks,
        t.created_by,
        u.username AS created_by_username,

        t.created_at

      FROM transfers t

      INNER JOIN bases fb
        ON t.from_base_id = fb.id

      INNER JOIN bases tb
        ON t.to_base_id = tb.id

      INNER JOIN equipment_types et
        ON t.equipment_type_id = et.id

      LEFT JOIN users u
        ON t.created_by = u.id

      WHERE t.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get transfer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transfer",
    });
  }
};
