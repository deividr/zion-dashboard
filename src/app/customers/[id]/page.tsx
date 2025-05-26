"use client";

import { Address, Customer } from "@/domains";
import { useHeaderStore } from "@/stores/header-store";
import { useFetchClient } from "@/lib/fetch-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerForm } from "./customer-form";
import { AddressSection } from "./address-section";

export default function CustomerDetail() {
  const { fetch } = useFetchClient();
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const setTitle = useHeaderStore((state) => state.setTitle);

  useEffect(() => {
    setTitle(["Clientes", id === "new" ? "Novo Cliente" : "Atualizar Cliente"]);
  }, [setTitle, id]);

  useEffect(() => {
    if (id === "new") {
      setCustomer({
        name: "",
        email: "",
        phone: "",
        phone2: "",
      });
      return;
    }

    const fetchCustomer = async () => {
      const result = await fetch<{
        customer: Customer;
        addresses: Address[];
      }>(`${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`);
      setCustomer(result?.customer ?? null);
      setAddresses(result?.addresses ?? []);
    };

    fetchCustomer();
  }, [id, fetch]);

  if (!customer) return <div>Loading...</div>;

  return (
    <>
      <CustomerForm customer={customer}>
        <AddressSection initialAddresses={addresses} customer={customer} />
      </CustomerForm>
    </>
  );
}
