"use client";

import { FullPagination } from "@/components/full-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, Product } from "@/domains";
import { useFetchClient } from "@/lib/fetch-client";
import { productEndpoints } from "@/repository/productRepository";
import { useHeaderStore } from "@/stores/header-store";
import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable } from "../../components/data-table";
import { columns } from "./columns";
import { categoryEndpoints } from "@/repository/categoryRepository";

export default function Products() {
    const PAGE_SIZE = 10;
    const router = useRouter();
    const params = useSearchParams();
    const [isLoading, setLoading] = useState(true);
    const [page, setPage] = useState(parseInt(params.get("page") || "1"));
    const [totalProducts, setTotalProducts] = useState<number>(0);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState(params.get("search") || "");
    const { fetch } = useFetchClient();
    const setTitle = useHeaderStore((state) => state.setTitle);

    useEffect(() => {
        console.log("Effect 1");
        setTitle(["Produtos"]);
    }, [setTitle]);

    useEffect(() => {
        const fetchCategories = async () => {
            const dataCategories = await fetch<Category[]>(categoryEndpoints.list());
            setCategories(dataCategories || []);
        };
        fetchCategories();
    }, [setCategories, fetch]);

    useEffect(() => {
        console.log("Effect 2");
        setLoading(true);
        const fetchProducts = async () => {
            const dataProducts = await fetch<{
                products: Product[];
            }>(productEndpoints.list(1, ""));
            setAllProducts(dataProducts?.products || []);
            setLoading(false);
        };

        fetchProducts();
    }, [fetch]);

    useEffect(() => {
        console.log("Effect 3");
        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const filterProducts = allProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
        setProducts(filterProducts.slice(startIndex, endIndex));
        setTotalProducts(filterProducts.length);
    }, [page, search, allProducts]);

    const handleChangePage = (newPage: number) => setPage(newPage);

    const buildLink = (newPage: number, newSearch: string) => {
        const query = new URLSearchParams();
        query.set("page", newPage.toString());

        if (newSearch?.length) {
            query.set("search", newSearch);
        }

        router.replace(`?${query.toString()}`);
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex gap-10">
                <div className="grow">
                    <Input
                        placeholder="Pesquisar por produto..."
                        icon={Search}
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                            buildLink(1, e.target.value);
                        }}
                    />
                </div>
                <Button onClick={() => router.push("products/new")}>
                    <Plus /> Novo Produto
                </Button>
            </div>
            <DataTable columns={columns(categories)} data={products} isLoading={isLoading} />
            <FullPagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={totalProducts}
                onChangePageAction={handleChangePage}
            />
        </div>
    );
}
