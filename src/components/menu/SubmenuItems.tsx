import { Link } from "react-router-dom";

type Props = {
  data: string[];
  paths: string[];
};

const SubmenuItems = ({ data, paths }: Props) => {
  return (
    <>
      <ul className="flex  list-none p-0 d-flex text-white justify-end m-0">
        {data.map((item, index) => (
          <li key={index} className="px-3 py-2 hover:bg-green-600 rounded-md">
            <Link
              to={paths[index]}
              className=" list-unstyled text-decoration-none text-white  px-3 py-2 rounded-md text-sm font-medium"
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default SubmenuItems;
