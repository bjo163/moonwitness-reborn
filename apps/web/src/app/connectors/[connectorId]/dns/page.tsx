import DnsWorkspace from "../../../../features/connectors/dns-workspace";

export const metadata = {
  title: "Zone DNS",
};

export default async function ConnectorDnsPage({
  params,
}: {
  params: Promise<{ connectorId: string }>;
}) {
  const { connectorId } = await params;
  return <DnsWorkspace connectorId={connectorId} />;
}
