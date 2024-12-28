import { Product, columns } from "./columns";
import { DataTable } from "../../components/data-table";

async function getProducts(): Promise<Product[]> {
  const data = await fetch("http://192.168.15.34:3000/products");
  const products = await data.json();
  return products;
}

export default async function Products() {
  const data = await getProducts();

  return (
    <div className="container mx-auto flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Produtos</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
