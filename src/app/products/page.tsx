import { Product, columns } from "./columns";
import { DataTable } from "../../components/data-table";

async function getData(): Promise<Product[]> {
  return [
    {
      id: "728ed52f",
      name: "Coca-Cola",
      value: 1000,
      unityType: "unity",
    },
    {
      id: "728ed52f",
      name: "Rondeli",
      value: 5600,
      unityType: "kilogram",
    },
    {
      id: "728ed52f",
      name: "Lasanha",
      value: 4500,
      unityType: "kilogram",
    },
    {
      id: "728ed52f",
      name: "Nhochi",
      value: 5400,
      unityType: "kilogram",
    },
    {
      id: "728ed52f",
      name: "Conquilha",
      value: 5200,
      unityType: "kilogram",
    },
  ];
}

export default async function Products() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
