import { useEffect, useState } from "react";

import { createPurchase, getPurchases } from "../services/purchaseService";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    baseId: "",
    equipmentTypeId: "",
    quantity: "",
    purchaseDate: "",
  });

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setLoading(true);

        const response = await getPurchases();

        setPurchases(response?.data || []);
      } catch (error) {
        console.error("Failed to load purchases:", error);

        setError(error?.response?.data?.message || "Failed to load purchases");
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.baseId || !formData.equipmentTypeId || !formData.quantity) {
      setError("Base, equipment type and quantity are required.");
      return;
    }

    try {
      setSaving(true);

      await createPurchase({
        baseId: Number(formData.baseId),
        equipmentTypeId: Number(formData.equipmentTypeId),
        quantity: Number(formData.quantity),
        purchaseDate: formData.purchaseDate || null,
      });

      setSuccess("Purchase recorded successfully.");

      setFormData({
        baseId: "",
        equipmentTypeId: "",
        quantity: "",
        purchaseDate: "",
      });

      // eslint-disable-next-line no-undef
      await loadPurchases();
    } catch (error) {
      console.error("Purchase error:", error);

      setError(error?.response?.data?.message || "Failed to create purchase.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Purchases</h1>

          <p className="mt-1 text-sm text-slate-500">
            Record incoming military assets.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Add Purchase
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Base ID
              </label>

              <input
                name="baseId"
                type="number"
                min="1"
                value={formData.baseId}
                onChange={handleChange}
                placeholder="1"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Equipment Type ID
              </label>

              <input
                name="equipmentTypeId"
                type="number"
                min="1"
                value={formData.equipmentTypeId}
                onChange={handleChange}
                placeholder="1"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Quantity
              </label>

              <input
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="100"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Purchase Date
              </label>

              <input
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Record Purchase"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Purchase History
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading purchases...</p>
          ) : purchases.length === 0 ? (
            <p className="text-sm text-slate-500">No purchases found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Base</th>
                    <th className="px-4 py-3">Equipment</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">{purchase.id}</td>

                      <td className="px-4 py-3">{purchase.base_name}</td>

                      <td className="px-4 py-3">{purchase.equipment_name}</td>

                      <td className="px-4 py-3">{purchase.category}</td>

                      <td className="px-4 py-3 font-semibold">
                        {purchase.quantity}
                      </td>

                      <td className="px-4 py-3">
                        {purchase.created_at
                          ? new Date(purchase.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchases;
