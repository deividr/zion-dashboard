import { Product, columns } from './columns';
import { DataTable } from '../../components/data-table';

async function getProducts(): Promise<Product[]> {
  const data = await fetch('http://192.168.15.34:3000/products');
  const products = await data.json();
  return products;
}

export default async function Products() {
  const data = await getProducts();

  return (
    <div className='container mx-auto'>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
