import pool from "../config/db.js";

// Get inventory report
export const getInventoryReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.id AS base_id,
        b.name AS base_name,
        b.location,
        et.id AS equipment_type_id,
        et.name AS equipment_name,
        et.category,
        COALESCE(SUM(a.quantity), 0)::int AS quantity
      FROM bases b
      CROSS JOIN equipment_types et
      LEFT JOIN assets a
        ON a.base_id = b.id
        AND a.equipment_type_id = et.id
      GROUP BY
        b.id,
        b.name,
        b.location,
        et.id,
        et.name,
        et.category
      ORDER BY b.name, et.name
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Inventory report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate inventory report",
    });
  }
};

// Get summary report
export const getSummaryReport = async (req, res) => {
  try {
    const [
      bases,
      equipment,
      inventory,
      purchases,
      transfers,
      assignments,
      expenditures,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM bases"),
      pool.query("SELECT COUNT(*)::int AS total FROM equipment_types"),
      pool.query(`
        SELECT
          COALESCE(SUM(quantity), 0)::int AS total
        FROM assets
      `),
      pool.query("SELECT COUNT(*)::int AS total FROM purchases"),
      pool.query("SELECT COUNT(*)::int AS total FROM transfers"),
      pool.query("SELECT COUNT(*)::int AS total FROM assignments"),
      pool.query("SELECT COUNT(*)::int AS total FROM expenditures"),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBases: bases.rows[0].total,
        totalEquipmentTypes: equipment.rows[0].total,
        totalInventory: inventory.rows[0].total,
        totalPurchases: purchases.rows[0].total,
        totalTransfers: transfers.rows[0].total,
        totalAssignments: assignments.rows[0].total,
        totalExpenditures: expenditures.rows[0].total,
      },
    });
  } catch (error) {
    console.error("Summary report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate summary report",
    });
  }
};
