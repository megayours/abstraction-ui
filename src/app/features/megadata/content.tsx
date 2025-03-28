export default function Content() {
    return (
        <section className="py-16 md:py-20">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-medium">Tokens should be accompanied with on-chain metadata</h2>
                    <div className="space-y-6">
                        <p>
                            Current solutions for token metadata are either centralized or static. This is typically not by choice but due to the lack of an on-chain decentralized and flexible solution.
                        </p>
                        <p>
                            Megadata is a decentralized, on-chain metadata solution that allows you to attach metadata to your tokens and evolve it over time through decentralized, attachable, reusable modules for shared logic.
                        </p>
                    </div>
                </div>
                <div className="mt-20">
                    <p>
                        We offer a solution where the token ownership can remain on the original chain, while the metadata is stored on the Megadata Chain. To achieve this in a seamless way, we have created an SDK that provides a developer friendly experience native to the targeted ecosystem.
                    </p>
                </div>
            </div>
        </section>
    )
}
