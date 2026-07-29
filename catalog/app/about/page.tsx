import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden grain">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-4.jpg"
            alt="About Gloriaz Daughter"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-warm-black/50" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="animate-fade-up text-xs font-medium uppercase tracking-[0.35em] text-champagne">
            About Us
          </p>
          <h1 className="animate-fade-up delay-100 text-5xl md:text-7xl font-serif font-light text-white tracking-tight">
            Our Story
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 md:py-32 bg-background relative grain">
        <div className="container mx-auto px-6 md:px-8 max-w-3xl">
          <blockquote className="text-2xl md:text-3xl font-serif font-light text-foreground text-center mb-16 leading-snug">
            &ldquo;Gloriaz Daughter was born from a legacy of craftsmanship, dedication to detail, and a profound love for the art of tailoring.&rdquo;
          </blockquote>

          <div className="w-12 h-px bg-primary mx-auto mb-16" />

          <div className="space-y-6 text-muted-foreground font-light leading-[1.85] text-base">
            <p>
              Founded on the principles of timeless elegance and modern sophistication, Gloriaz Daughter represents the pinnacle of bespoke fashion. Every garment we create is a testament to our commitment to quality, designed not just to be worn, but to be experienced.
            </p>

            <p>
              Our journey began with a simple belief: that clothing should be an extension of one&apos;s identity. We source only the finest fabrics from around the world, ensuring that each piece feels as luxurious as it looks. Our master tailors bring decades of experience to every stitch, combining traditional techniques with contemporary design sensibilities.
            </p>
          </div>

          <div className="my-20 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src="/images/pexels-rdne-6191995.jpg" alt="Studio" fill className="object-cover" />
            </div>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src="/images/pexels-rdne-6191990.jpg" alt="Craftsmanship" fill className="object-cover" />
            </div>
          </div>

          <div className="space-y-6 text-muted-foreground font-light leading-[1.85] text-base">
            <p>
              Whether you are looking for a custom-designed suit that commands attention, an elegant dress for a special occasion, or a ready-to-wear piece that elevates your everyday wardrobe, Gloriaz Daughter is here to bring your vision to life.
            </p>

            <p>
              We invite you to explore our collection, book a fitting, and experience the difference of true bespoke tailoring.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
