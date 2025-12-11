import { motion } from "framer-motion";

interface BlurTextProps {
    text: string;
    className?: string;
    delay?: number;
}

const BlurText = ({ text, className = "", delay = 0 }: BlurTextProps) => {
    const words = text.split(" ");

    return (
        <div className={`flex flex-wrap justify-center gap-[0.3em] ${className}`}>
            {words.map((word, wordIndex) => (
                <div key={wordIndex} className="inline-block overflow-hidden">
                    <motion.span
                        initial={{ filter: "blur(10px)", opacity: 0, y: 10 }}
                        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: delay + wordIndex * 0.2,
                            ease: "easeOut",
                        }}
                        className="inline-block"
                    >
                        {word}
                    </motion.span>
                </div>
            ))}
        </div>
    );
};

export default BlurText;
