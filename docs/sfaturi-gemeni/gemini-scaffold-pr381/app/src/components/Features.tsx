import { motion } from "motion/react";
import { Cpu, Globe, Layers, BarChart3 } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: <Cpu className="w-8 h-8" aria-hidden="true" />,
      title: "Precision Farming",
      description: "AI-driven agricultural optimization in Puiești, maximizing yield and sustainability through real-time data."
    },
    {
      icon: <Globe className="w-8 h-8" aria-hidden="true" />,
      title: "Rural Innovation",
      description: "Scaling local economic growth by integrating next-gen processing units and smart infrastructure."
    },
    {
      icon: <Layers className="w-8 h-8" aria-hidden="true" />,
      title: "Community Foundation",
      description: "Solaris (CET) serves as the digital foundation for the Cetățuia community, fostering local development."
    },
    {
      icon: <BarChart3 className="w-8 h-8" aria-hidden="true" />,
      title: "Hyper-Scarcity",
      description: "A strictly fixed supply of 9,000 tokens on the TON blockchain, ensuring value preservation for the community."
    }
  ];

  return (
    <section id="protocol" className="py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-amber-500 font-bold uppercase tracking-[0.2em] text-sm mb-4">Our Mission</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Sustainable Local Growth</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We bridge the gap between advanced AI technology and rural development, creating a robust tech solution for sustainable communities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-4">{feature.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
