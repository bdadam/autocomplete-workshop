import { NextPage } from 'next';

import styles from '../styles/index.module.css';

import AISearch from 'src/components/AISearch/AISearch';

const IndexPage: NextPage = () => {
    return (
        <div className={styles.hero}>
            <AISearch />
        </div>
    );
};

export default IndexPage;
