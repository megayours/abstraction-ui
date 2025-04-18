import ModuleGraph from "@/components/module-graph/module-graph";
import PageWrapper from "@/components/page-wrapper";
import { Card } from "@/components/ui/card";
export default function GraphTest() {
  return (
    <PageWrapper>
      <Card className="w-full h-full">
        <ModuleGraph token={{
          id: "1",
          collection_id: 1,
        data: { "id": "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8", "uri": "ipfs://bafybeibc5sgo2plmjkq2tzmhrn54bk3crhnc23zd2msg4ea7a4pxrkgfna/0", "name": "Pudgy Penguin #0", "image": "ipfs://QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/0.png", "source": "ethereum", "attributes": [{ "value": "Purple", "trait_type": "Background" }, { "value": "Mint", "trait_type": "Skin" }, { "value": "Hoodie Pink", "trait_type": "Body" }, { "value": "Winking", "trait_type": "Face" }, { "value": "Wizard Hat", "trait_type": "Head" }], "description": "A collection 8888 Cute Chubby Pudgy Penquins sliding around on the freezing ETH blockchain." },
        modules: ["erc721", "extending_metadata", "extending_collection"],
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      }} />
      </Card>
    </PageWrapper>
  )
}