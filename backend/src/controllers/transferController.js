import pool from "../config/db.js";

export const createTransfer = async (req, res) => {
  const client = await pool.connect();

  try {
    const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity } =
      req.body;

    if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (sourceBaseId === destinationBaseId) {
      return res.status(400).json({
        success: false,
        message: "Source and destination bases must be different",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    await client.query("BEGIN");

    const transferResult = await client.query(
      `
      INSERT INTO transfers (
        source_base_id,
        destination_base_id,
        equipment_type_id,
        quantity,
        initiated_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        sourceBaseId,
        destinationBaseId,
        equipmentTypeId,
        Number(quantity),
        req.user?.id || null,
      ],
    );

    if (req.user?.id) {
      await client.query(
        `
        INSERT INTO audit_logs (
          user_id,
          action,
          details
        )
        VALUES ($1, 'TRANSFER', $2)
        `,
        [
          req.user.id,
          `Transferred ${quantity} items from Base ${sourceBaseId} to Base ${destinationBaseId}`,
        ],
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Transfer completed successfully",
      data: transferResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Transfer error:", error);

    return res.status(500).json({
      success: false,
      message: "Transfer failed",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

export const getTransfers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.source_base_id,
        sb.name AS source_base,
        t.destination_base_id,
        db.name AS destination_base,
        t.equipment_type_id,
        e.name AS equipment_name,
        e.category,
        t.quantity,
        t.status,
        t.timestamp
      FROM transfers t
      JOIN bases sb
        ON sb.id = t.source_base_id
      JOIN bases db
        ON db.id = t.destination_base_id
      JOIN equipment_types e
        ON e.id = t.equipment_type_id
      ORDER BY t.timestamp DESC
    `);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get transfers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transfers",
      error: error.message,
    });
  }
};
