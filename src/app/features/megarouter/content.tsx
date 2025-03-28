export default function Content() {
    return (
        <section className="py-16 md:py-20">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-medium">MegaRouter is the gateway to your Megadata</h2>
                    <div className="space-y-6">
                        <p>
                            Megadata is stored as tokens fully on-chain on the Megadata Chain where they can either stay, or be moved around on various dapp chains for power users.
                        </p>
                        <p>
                            Of course, you can fetch the metadata directly from the chain where it currently resides, but MegaRouter serves as a gateway to locate the metadata and return it according to your needs in terms of format and standards.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
