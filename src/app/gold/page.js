import CommodityClient from '../commodities/[type]/client';

export default function GoldPageProxy() {
  return <CommodityClient type="gold" />;
}
