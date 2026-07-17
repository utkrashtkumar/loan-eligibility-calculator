import CommodityClient from './client';

export function generateStaticParams() {
  return [
    { type: 'gold' },
    { type: 'silver' }
  ];
}

export default async function Page({ params }) {
  const { type } = await params;
  return <CommodityClient type={type} />;
}
