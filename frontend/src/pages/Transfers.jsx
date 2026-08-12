import { useEffect, useState } from "react";

import { createTransfer, getTransfers } from "../services/transferService";

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    sourceBaseId: "",
    destinationBaseId: "",
    equipmentTypeId: "",
    quantity: "",
  });

  const loadTransfers = async () => {
    try {
      const response = await getTransfers();
      setTransfers(response?.data || []);
    } catch (error) {
      setError(error?.response?.data?.message || "Failed to load transfers");
    }
  };

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await getTransfers();
        setTransfers(response?.data || []);
      } catch (error) {
        setError(error?.response?.data?.message || "Failed to load transfers");
      }
    };

    fetchTransfers();
  }, []);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      await createTransfer({
        sourceBaseId: Number(formData.sourceBaseId),
        destinationBaseId: Number(formData.destinationBaseId),
        equipmentTypeId: Number(formData.equipmentTypeId),
        quantity: Number(formData.quantity),
      });

      setSuccess("Transfer completed successfully.");

      setFormData({
        sourceBaseId: "",
        destinationBaseId: "",
        equipmentTypeId: "",
        quantity: "",
      });

      await loadTransfers();
    } catch (error) {
      setError(error?.response?.data?.message || "Transfer failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-slate-900">Transfers</h1>

        <p className="mt-1 mb-6 text-sm text-slate-500">
          Manage asset movement between military bases.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Create Transfer</h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
          >
            <input
              name="sourceBaseId"
              type="number"
              min="1"
              placeholder="Source Base ID"
              value={formData.sourceBaseId}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              name="destinationBaseId"
              type="number"
              min="1"
              placeholder="Destination Base ID"
              value={formData.destinationBaseId}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              name="equipmentTypeId"
              type="number"
              min="1"
              placeholder="Equipment Type ID"
              value={formData.equipmentTypeId}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <input
              name="quantity"
              type="number"
              min="1"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 px-4 py-3"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60 md:col-span-4"
            >
              {saving ? "Processing..." : "Create Transfer"}
            </button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Transfer History</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">{transfer.id}</td>

                    <td className="px-4 py-3">{transfer.source_base}</td>

                    <td className="px-4 py-3">{transfer.destination_base}</td>

                    <td className="px-4 py-3">{transfer.equipment_name}</td>

                    <td className="px-4 py-3 font-semibold">
                      {transfer.quantity}
                    </td>

                    <td className="px-4 py-3">{transfer.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfers;
