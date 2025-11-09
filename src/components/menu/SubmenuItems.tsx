import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Props = {
  data: string[];
  paths: string[];
  className?: string;
};

const SubmenuItems = ({ data, paths, className }: Props) => {
  return (
    <ul
      className={cn(
        "flex flex-col md:flex-row justify-center md:justify-end gap-2 md:gap-6",
        className
      )}
    >
      {data.map((item, index) => (
        <li
          key={index}
          className="hover:bg-gray-700 rounded-md transition-colors"
        >
          <Link
            to={paths[index]}
            className="block px-4 py-2 text-white text-sm font-sans font-medium"
          >
            {item}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default SubmenuItems;
