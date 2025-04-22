"use client";

import { Customer } from "@/domains";
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
  const [addresses, setAddresses] = useState<[]>([]);
  const setTitle = useHeaderStore((state) => state.setTitle);

  useEffect(() => {
    setTitle(["Clientes", id !== "new" ? "Atualizar Cliente" : "Novo Cliente"]);
  }, [setTitle, id]);

  useEffect(() => {
    if (id === "new") {
      setCustomer({ id: "new", name: "", email: "", phone: "", phone2: "" });
      return;
    }

    const fetchCustomer = async () => {
      const { customer, addresses } = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`
      );
      setCustomer(customer);
      setAddresses(addresses);
    };
    fetchCustomer();
  }, [id, fetch]);

  if (!customer) return <div>Loading...</div>;

  return (
    <>
      <CustomerForm customer={customer} />
      <AddressSection customer={customer} initialAddresses={addresses} />
    </>
  );
}
