use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AgreementNotFound = 1,
    Unauthorized = 2,
    InvalidStatus = 3,
    NoMilestones = 4,
    TooManyMilestones = 5,
    InvalidAmount = 6,
    MilestoneNotFound = 7,
    InvalidMilestoneStatus = 8,
    /// Milestones must be completed in order
    OutOfSequence = 9,
    AlreadyPaid = 10,
    InsufficientEscrow = 11,
    SameParty = 12,
    CancelAlreadyRequested = 13,
    NoCancelRequest = 14,
    Overflow = 15,
}
