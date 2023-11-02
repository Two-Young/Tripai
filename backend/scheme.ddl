create table exchange_rates
(
    from_currency_code varchar(5) not null,
    to_currency_code   varchar(5) not null,
    rate               double     not null,
    updated_at         datetime   not null,
    primary key (from_currency_code, to_currency_code)
);

create table place_detail_caches
(
    place_id        varchar(255) not null
        primary key,
    name            varchar(255) null,
    address         varchar(255) null,
    photo_reference varchar(255) null,
    latitude        double       null,
    longitude       double       null,
    lat_lng         varchar(255) null,
    hit             int          null,
    country_code    varchar(10)  null
);

create table session_thumbnail_caches
(
    keyword varchar(255) not null,
    url     varchar(255) not null
);

create table users
(
    uid                   varchar(255)             not null
        primary key,
    id                    varchar(255)             not null,
    user_code             varchar(255)             not null comment 'use as identifier of friend recognition',
    username              varchar(150)             not null,
    profile_image         varchar(255)             null,
    platform              varchar(100)             not null,
    allow_nickname_search tinyint(1) default 1     not null,
    default_currency_code varchar(5) default 'USD' not null,
    constraint users_pk
        unique (user_code)
);

create table sessions
(
    sid           varchar(255) not null
        primary key,
    session_code  varchar(255) not null,
    creator_uid   varchar(255) null,
    name          varchar(255) not null,
    start_at      date         null,
    end_at        date         null,
    created_at    datetime     not null,
    thumbnail_url varchar(255) null,
    constraint sessions_pk
        unique (session_code),
    constraint sessions_users_uid_fk
        foreign key (creator_uid) references users (uid)
            on delete set null
);

create table budgets
(
    bid           varchar(255) not null
        primary key,
    currency_code varchar(5)   not null,
    amount        double       not null,
    uid           varchar(255) not null,
    sid           varchar(255) not null,
    constraint budgets_pk
        unique (currency_code, uid, sid),
    constraint budgets_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade,
    constraint budgets_users_uid_fk
        foreign key (uid) references users (uid)
            on delete cascade
);

create table countries
(
    scid                varchar(255) not null
        primary key,
    country_code        varchar(20)  not null,
    sid                 varchar(255) null,
    airline_reserve_url varchar(255) null,
    constraint countries_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade
);

create table expenditures
(
    eid           varchar(255) not null
        primary key,
    name          varchar(255) not null,
    total_price   double       not null,
    currency_code varchar(3)   not null,
    category      varchar(50)  not null,
    payed_at      datetime     not null,
    sid           varchar(255) null,
    constraint expenditures_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade
);

create table expenditure_distribution
(
    eid   varchar(255) not null,
    uid   varchar(255) not null,
    num   bigint       not null,
    denom bigint       not null,
    constraint expenditure_distribution_pk
        unique (eid, uid),
    constraint expenditure_distribution_expenditures_eid_fk
        foreign key (eid) references expenditures (eid)
            on delete cascade,
    constraint expenditure_distribution_users_uid_fk
        foreign key (uid) references users (uid)
);

create table expenditure_items
(
    eiid  varchar(255) not null
        primary key,
    label varchar(255) not null,
    price double       not null,
    eid   varchar(255) not null,
    constraint expenditure_items_expenditures_eid_fk
        foreign key (eid) references expenditures (eid)
            on delete cascade
);

create table expenditure_item_allocation
(
    eiid varchar(255) not null,
    uid  varchar(255) not null,
    primary key (eiid, uid),
    constraint expenditure_item_allocation_expenditure_items_eiid_fk
        foreign key (eiid) references expenditure_items (eiid)
            on delete cascade,
    constraint expenditure_item_allocation_users_uid_fk
        foreign key (uid) references users (uid)
);

create table expenditure_payers
(
    eid varchar(255) not null,
    uid varchar(255) not null,
    constraint expenditure_payers_pk
        unique (eid, uid),
    constraint expenditure_payers_expenditures_eid_fk
        foreign key (eid) references expenditures (eid)
            on delete cascade,
    constraint expenditure_payers_users_uid_fk
        foreign key (uid) references users (uid)
);

create table locations
(
    lid             varchar(255) not null
        primary key,
    place_id        varchar(255) null,
    name            varchar(255) null,
    latitude        double       null,
    longitude       double       null,
    address         varchar(255) null,
    photo_reference varchar(255) null,
    sid             varchar(50)  null,
    constraint locations_pk
        unique (sid, place_id),
    constraint locations_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade
);

create table schedules
(
    sscid           varchar(255) not null
        primary key,
    name            varchar(255) null,
    photo_reference varchar(255) null,
    place_id        varchar(255) null,
    address         varchar(255) null,
    day             int          null,
    latitude        double       null,
    longitude       double       null,
    start_at        datetime     null,
    memo            longtext     null,
    sid             varchar(50)  null,
    constraint schedules_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade
);

create table session_invitations
(
    sid        varchar(255) not null,
    uid        varchar(255) not null,
    invited_at datetime     not null,
    primary key (sid, uid),
    constraint session_invitations_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade,
    constraint session_invitations_users_uid_fk
        foreign key (uid) references users (uid)
            on delete cascade
);

create table session_join_requests
(
    sid          varchar(255) not null,
    uid          varchar(255) not null,
    requested_at datetime     not null,
    primary key (sid, uid),
    constraint session_join_requests_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade,
    constraint session_join_requests_users_uid_fk
        foreign key (uid) references users (uid)
            on delete cascade
);

create table transactions
(
    sender_uid    varchar(255) not null,
    receiver_uid  varchar(255) not null,
    currency_code varchar(5)   not null,
    amount        double       not null,
    sent_at       datetime     not null,
    sid           varchar(255) not null,
    constraint transactions_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade,
    constraint transactions_users_uid_fk
        foreign key (sender_uid) references users (uid),
    constraint transactions_users_uid_fk2
        foreign key (receiver_uid) references users (uid)
);

create table user_sessions
(
    sid       varchar(255) not null,
    uid       varchar(255) not null,
    joined_at datetime     not null,
    constraint user_sessions_pk
        unique (sid, uid),
    constraint user_sessions_sessions_sid_fk
        foreign key (sid) references sessions (sid)
            on delete cascade,
    constraint user_sessions_users_uid_fk
        foreign key (uid) references users (uid)
            on delete cascade
);

create table users_friends
(
    uid           varchar(255)         not null,
    requested_uid varchar(255)         not null,
    accepted      tinyint(1) default 0 not null,
    requested_at  datetime             not null,
    confirmed_at  datetime             null comment 'accepted or rejected datetime',
    primary key (uid, requested_uid),
    constraint users_friends_users_uid_fk
        foreign key (uid) references users (uid)
            on delete cascade,
    constraint users_friends_users_uid_fk2
        foreign key (requested_uid) references users (uid)
            on delete cascade
);

