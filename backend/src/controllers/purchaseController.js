import pool from "../config/db.js";

export const createPurchase = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, purchaseDate } = req.body;

    if (!baseId || !equipmentTypeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Base, equipment type and quantity are required",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO purchases (
        base_id,
        equipment_type_id,
        quantity,
        created_at
      )
      VALUES ($1, $2, $3, COALESCE($4::timestamp, CURRENT_TIMESTAMP))
      RETURNING *
      `,
      [baseId, equipmentTypeId, Number(quantity), purchaseDate || null],
    );

    const purchase = result.rows[0];

    if (req.user?.id) {
      await pool.query(
        `
        INSERT INTO audit_logs (
          user_id,
          action,
          details
        )
        VALUES ($1, 'PURCHASE', $2)
        `,
        [
          req.user.id,
          `Purchased ${quantity} items of equipment type ${equipmentTypeId} for base ${baseId}`,
        ],
      );
    }

    return res.status(201).json({
      success: true,
      message: "Purchase recorded successfully",
      data: purchase,
    });
  } catch (error) {
    console.error("Create purchase error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase",
      error: error.message,
    });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const { baseId, equipmentTypeId } = req.query;

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.base_id,
        b.name AS base_name,
        p.equipment_type_id,
        e.name AS equipment_name,
        e.category,
        p.quantity,
        p.created_at
      FROM purchases p
      JOIN bases b
        ON b.id = p.base_id
      JOIN equipment_types e
        ON e.id = p.equipment_type_id
      WHERE
        ($1::int IS NULL OR p.base_id = $1)
        AND
        ($2::int IS NULL OR p.equipment_type_id = $2)
      ORDER BY p.created_at DESC
      `,
      [baseId || null, equipmentTypeId || null],
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get purchases error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};
