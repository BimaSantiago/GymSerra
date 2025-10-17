type Props = {
  data: string[];
  paths: string[];
};

const SubmenuItems = ({ data, paths }: Props) => {
  return (
    <>
      <ul className="flex  list-none p-0 d-flex text-white justify-end m-0">
        {data.map((item, index) => (
          <li key={index} className=" hover:bg-green-600 rounded-md py-1.5">
            <a
              href={paths[index]}
              className=" list-unstyled text-decoration-none text-white  px-6 py-2 rounded-md text-sm font-medium"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
};

export default SubmenuItems;
