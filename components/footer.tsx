import Link from 'next/link';

const SimpleLink: React.FC<{ href: string }> = ({ children, href }) => {
  return (
    <Link href={href}>
      <a className="block hover:underline focus:underline">{children}</a>
    </Link>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 mt-3 py-6">
      <div className="container mx-auto flex flex-col md:flex-row px-3 md:px-0 justify-between">
        <div className="flex-col w-80">
          <p className="text-gray-100 mb-3">
            © The SAO/NASA Astrophysics Data System
          </p>
          <p className="text-gray-500">adshelp[at]cfa.harvard.edu</p>
          <p className="text-gray-500">
            The ADS is operated by the Smithsonian Astrophysical Observatory
            under NASA Cooperative Agreement NNX16AC86A
          </p>
          <div className="flex mt-3">
            <img src="/img/nasa.svg" alt="" className="w-16 h-14 mr-2" />
            <img src="/img/smithsonian.svg" alt="" className="w-16 h-16 mr-2" />
            <img src="/img/cfa.png" alt="" className="w-32 h-16" />
          </div>
        </div>
        <div className="flex-col text-gray-100">
          <p className="text-lg text-gray-100 mb-3">Resources</p>
          <SimpleLink href="#">About ADS</SimpleLink>
          <SimpleLink href="#">ADS Help</SimpleLink>
          <SimpleLink href="#">What's New</SimpleLink>
          <SimpleLink href="#">Careers@ADS</SimpleLink>
          <SimpleLink href="#">Accessibilty</SimpleLink>
        </div>
        <div className="flex-col text-gray-100">
          <p className="text-lg text-gray-100 mb-3">Social</p>
          <SimpleLink href="#">@adsabs</SimpleLink>
          <SimpleLink href="#">ADS Blog</SimpleLink>
        </div>
        <div className="flex-col text-gray-100">
          <p className="text-lg text-gray-100 mb-3">Project</p>
          <SimpleLink href="#">Privacy Policy</SimpleLink>
          <SimpleLink href="#">Terms of Use</SimpleLink>
          <SimpleLink href="#">
            Smithsonian Astrophysical Observatory
          </SimpleLink>
          <SimpleLink href="#">Smithsonian Institution</SimpleLink>
          <SimpleLink href="#">NASA</SimpleLink>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
