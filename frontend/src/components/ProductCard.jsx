import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  if (!product) return null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="block border rounded-lg p-4 hover:shadow"
    >
      <img
        src={product.image || "/placeholder.png"}
        alt={product.name}
        className="w-full h-48 object-cover rounded"
      />

      <h3 className="mt-2 font-semibold">
        {product.name}
      </h3>

      <p className="text-green-600 font-bold">
        UGX {product.price}
      </p>
    </Link>
  );
}
